/**
 * Compresseur d'images pour GoCompress
 * Utilise la bibliothèque browser-image-compression (chargée globalement)
 */

/**
 * Compresse une image avec des paramètres optimisés pour mobile
 * @param {File} file - Fichier image à compresser
 * @param {number} quality - Qualité (0-100)
 * @param {Function} onProgress - Callback de progression (0-100)
 * @returns {Promise<Blob>} Image compressée
 */
export async function compressImage(file, quality = 80, onProgress = null) {
    try {
        // Vérifier que la bibliothèque est chargée
        if (typeof imageCompression === 'undefined') {
            throw new Error('La bibliothèque de compression d\'images n\'est pas chargée.');
        }

        // Vérification de la taille
        if (file.size === 0) {
            throw new Error('Le fichier est vide.');
        }

        // Détection du navigateur mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);
        const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

        // Détection du type de fichier
        const isJPEG = file.type === 'image/jpeg' || file.name.toLowerCase().match(/\.(jpe?g)$/);
        const isPNG = file.type === 'image/png' || file.name.toLowerCase().match(/\.(png)$/);
        const isWebP = file.type === 'image/webp' || file.name.toLowerCase().match(/\.(webp)$/);

        console.log('Mode mobile :', isMobile);
        console.log('Type de fichier :', isJPEG ? 'JPEG' : isPNG ? 'PNG' : isWebP ? 'WebP' : 'Autre');
        console.log('Taille originale :', (file.size / 1024).toFixed(1), 'Ko');

        // 🔥 NOUVEAU : Pour les JPEG, on teste d'abord avec le format JPEG original
        let compressedFile = null;
        let bestFile = file;
        let bestSize = file.size;

        // Si c'est un JPEG, on essaie d'abord en gardant le format JPEG
        if (isJPEG) {
            console.log('Tentative 1 : Compression JPEG → JPEG...');
            
            const jpegOptions = {
                maxSizeMB: isMobile ? 3 : 10,
                maxWidthOrHeight: isMobile ? 2048 : 4096,
                useWebWorker: !isMobile && !isLowMemory,
                fileType: 'image/jpeg', // Garder JPEG
                initialQuality: isMobile ? Math.min(quality / 100, 0.75) : quality / 100,
                alwaysKeepResolution: false,
                onProgress: (progress) => {
                    if (onProgress) {
                        onProgress(Math.round(progress * 0.6));
                    }
                }
            };

            try {
                const jpegResult = await imageCompression(file, jpegOptions);
                if (jpegResult && jpegResult.size < bestSize) {
                    bestFile = jpegResult;
                    bestSize = jpegResult.size;
                    console.log('Compression JPEG → JPEG :', (bestSize / 1024).toFixed(1), 'Ko');
                }
            } catch (e) {
                console.warn('Échec compression JPEG → JPEG :', e.message);
            }
        }

        // Ensuite, on essaie WebP pour tous les types
        console.log('Tentative 2 : Compression → WebP...');
        
        const webpOptions = {
            maxSizeMB: isMobile ? 3 : 10,
            maxWidthOrHeight: isMobile ? 2048 : 4096,
            useWebWorker: !isMobile && !isLowMemory,
            fileType: 'image/webp',
            initialQuality: isMobile ? Math.min(quality / 100, 0.75) : quality / 100,
            alwaysKeepResolution: false,
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(Math.round(50 + progress * 0.4));
                }
            }
        };

        try {
            const webpResult = await imageCompression(file, webpOptions);
            if (webpResult && webpResult.size < bestSize) {
                bestFile = webpResult;
                bestSize = webpResult.size;
                console.log('Compression → WebP :', (bestSize / 1024).toFixed(1), 'Ko');
            } else if (webpResult && webpResult.size > bestSize) {
                console.log('WebP est plus lourd (' + (webpResult.size / 1024).toFixed(1) + ' Ko) que le JPEG (' + (bestSize / 1024).toFixed(1) + ' Ko)');
            }
        } catch (e) {
            console.warn('Échec compression → WebP :', e.message);
        }

        // Si la taille a augmenté ou n'a pas assez diminué, on essaie plus agressif
        if (bestSize >= file.size * 0.85 && file.size > 300 * 1024) {
            console.log('Tentative 3 : Compression agressive...');
            
            const aggressiveOptions = {
                maxSizeMB: isMobile ? 1.5 : 3,
                maxWidthOrHeight: isMobile ? 1280 : 2048,
                useWebWorker: false,
                fileType: isJPEG ? 'image/jpeg' : 'image/webp', // Garder le format original si c'était JPEG
                initialQuality: 0.5, // 50% qualité
                alwaysKeepResolution: false,
                onProgress: (progress) => {
                    if (onProgress) {
                        onProgress(Math.round(90 + progress * 0.1));
                    }
                }
            };

            try {
                const aggressiveResult = await imageCompression(file, aggressiveOptions);
                if (aggressiveResult && aggressiveResult.size < bestSize) {
                    bestFile = aggressiveResult;
                    bestSize = aggressiveResult.size;
                    console.log('Compression agressive :', (bestSize / 1024).toFixed(1), 'Ko');
                }
            } catch (e) {
                console.warn('Échec compression agressive :', e.message);
            }
        }

        // Vérification finale
        if (bestSize >= file.size && file.size > 500 * 1024) {
            console.warn('Aucune compression n\'a réduit la taille, retour à l\'original.');
            if (onProgress) onProgress(100);
            return file;
        }

        if (bestSize >= file.size) {
            console.log('La taille est identique ou légèrement supérieure, retour à l\'original.');
            if (onProgress) onProgress(100);
            return file;
        }

        const gain = ((1 - bestSize / file.size) * 100).toFixed(1);
        console.log('Compression réussie :', {
            avant: (file.size / 1024).toFixed(1) + ' Ko',
            apres: (bestSize / 1024).toFixed(1) + ' Ko',
            gain: gain + '%'
        });

        if (onProgress) onProgress(100);
        return bestFile;
        
    } catch (error) {
        console.error('Erreur compression image:', error);
        // En cas d'erreur, on retourne le fichier original
        if (onProgress) onProgress(100);
        return file;
    }
}

/**
 * Compresse une image avec conversion en WebP
 * @param {File} file - Fichier image
 * @param {number} quality - Qualité (0-100)
 * @param {Function} onProgress - Callback progression
 * @returns {Promise<Blob>} Image compressée en WebP
 */
export async function compressImageToWebP(file, quality = 80, onProgress = null) {
    try {
        if (typeof imageCompression === 'undefined') {
            throw new Error('La bibliothèque de compression d\'images n\'est pas chargée.');
        }

        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(navigator.userAgent);

        const options = {
            maxSizeMB: isMobile ? 3 : 10,
            maxWidthOrHeight: isMobile ? 2048 : 4096,
            useWebWorker: !isMobile,
            fileType: 'image/webp',
            initialQuality: isMobile ? Math.min(quality / 100, 0.75) : quality / 100,
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress));
                }
            }
        };

        const compressedFile = await imageCompression(file, options);
        
        if (!compressedFile || compressedFile.size === 0) {
            throw new Error('La compression en WebP a échoué.');
        }

        // Vérification : si la taille augmente, on retourne l'original
        if (compressedFile.size > file.size) {
            console.warn('La conversion WebP augmente la taille, retour à l\'original.');
            return file;
        }

        return compressedFile;
        
    } catch (error) {
        console.error('Erreur compression WebP:', error);
        return file;
    }
}

/**
 * Vérifie si l'image peut être compressée
 * @param {File} file - Fichier image
 * @returns {boolean} True si compressible
 */
export function canCompressImage(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return validTypes.includes(file.type) || validExtensions.includes(ext);
}

/**
 * Obtient la taille recommandée pour l'image en fonction du format
 * @param {File} file - Fichier image
 * @returns {string} Taille recommandée
 */
export function getRecommendedSize(file) {
    const sizeKB = file.size / 1024;
    if (sizeKB < 100) return 'Déjà optimisée';
    if (sizeKB < 500) return 'Bonne compression';
    if (sizeKB < 2000) return 'Compression recommandée';
    return 'Compression nécessaire';
}

/**
 * Affiche un message d'information sur la compression
 * @param {File} file - Fichier image
 * @returns {string} Message d'information
 */
export function getCompressionAdvice(file) {
    const sizeMB = file.size / (1024 * 1024);
    const isJPEG = file.type === 'image/jpeg' || file.name.toLowerCase().match(/\.(jpe?g)$/);
    
    if (sizeMB < 0.1) return 'Cette image est déjà très légère.';
    if (sizeMB < 0.5) return 'Cette image peut être légèrement optimisée.';
    if (sizeMB < 2) return 'La compression donnera un bon résultat.';
    if (sizeMB < 5) return 'Cette image sera considérablement réduite.';
    if (isJPEG) return 'JPEG : La compression peut varier, nous gardons la meilleure version.';
    return 'La compression réduira fortement la taille.';
}