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
        
        // Détection de la mémoire disponible (approximative)
        const isLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

        // Log pour débogage
        console.log('📱 Mode mobile :', isMobile);
        console.log('🧠 Mémoire faible :', isLowMemory);

        // Paramètres adaptés selon l'appareil
        const options = {
            // Taille maximale en Mo (plus strict sur mobile)
            maxSizeMB: isMobile ? 3 : 10,
            
            // Taille max en pixels (important pour mobile)
            maxWidthOrHeight: isMobile ? 2048 : 4096,
            
            // Utiliser Web Worker (désactivé sur mobile pour éviter les bugs)
            useWebWorker: !isMobile && !isLowMemory,
            
            // Format de sortie (WebP est plus léger)
            fileType: 'image/webp',
            
            // Qualité (légèrement réduite sur mobile)
            initialQuality: isMobile ? Math.min(quality / 100, 0.75) : quality / 100,
            
            // Progression
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress));
                }
            },
            
            // Redimensionner toujours (même si l'image est petite)
            alwaysKeepResolution: false,
        };

        // Compression
        let compressedFile = await imageCompression(file, options);
        
        // Vérification du résultat
        if (!compressedFile || compressedFile.size === 0) {
            throw new Error('La compression a échoué.');
        }

        // 🔥 Si la taille augmente, on fait une 2ème tentative avec paramètres agressifs
        if (compressedFile.size > file.size) {
            console.warn('La compression a augmenté la taille, tentative avec paramètres plus agressifs...');
            
            // Deuxième tentative avec des paramètres plus stricts
            const fallbackOptions = {
                maxSizeMB: isMobile ? 1.5 : 3,
                maxWidthOrHeight: isMobile ? 1280 : 2048,
                useWebWorker: false,
                fileType: 'image/webp',
                initialQuality: 0.6, // 60% qualité
                alwaysKeepResolution: false,
                onProgress: (progress) => {
                    if (onProgress) {
                        onProgress(Math.round(progress));
                    }
                }
            };
            
            const fallbackFile = await imageCompression(file, fallbackOptions);
            
            // Si la 2ème tentative est meilleure, on la garde
            if (fallbackFile.size < compressedFile.size) {
                compressedFile = fallbackFile;
                console.log('Compression agressive réussie !');
            } else {
                // Sinon, on garde l'original (mieux que d'augmenter la taille)
                console.warn('La compression n\'a pas réduit la taille, retour à l\'original.');
                return file;
            }
        }

        // 🔥 Vérification supplémentaire : si la taille est encore trop grande
        if (compressedFile.size > file.size * 0.9 && file.size > 500 * 1024) {
            console.warn('⚠️ Réduction insuffisante, tentative avec qualité plus basse...');
            
            // Troisième tentative avec qualité très basse
            const ultraOptions = {
                maxSizeMB: isMobile ? 1 : 2,
                maxWidthOrHeight: isMobile ? 1024 : 1600,
                useWebWorker: false,
                fileType: 'image/webp',
                initialQuality: 0.4, // 40% qualité
                alwaysKeepResolution: false,
                onProgress: (progress) => {
                    if (onProgress) {
                        onProgress(Math.round(progress));
                    }
                }
            };
            
            const ultraFile = await imageCompression(file, ultraOptions);
            
            if (ultraFile.size < file.size && ultraFile.size < compressedFile.size) {
                compressedFile = ultraFile;
                console.log('Compression ultra réussie !');
            }
        }

        // Vérification finale
        if (compressedFile.size >= file.size && file.size > 500 * 1024) {
            console.warn('La compression n\'a pas fonctionné, retour à l\'original.');
            return file;
        }

        console.log('Compression réussie :', {
            avant: (file.size / 1024).toFixed(1) + ' Ko',
            apres: (compressedFile.size / 1024).toFixed(1) + ' Ko',
            gain: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
        });

        return compressedFile;
        
    } catch (error) {
        console.error(' Erreur compression image:', error);
        // En cas d'erreur, on retourne le fichier original
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
    if (sizeMB < 0.1) return 'Cette image est déjà très légère.';
    if (sizeMB < 0.5) return 'Cette image peut être légèrement optimisée.';
    if (sizeMB < 2) return 'La compression donnera un bon résultat.';
    if (sizeMB < 5) return 'Cette image sera considérablement réduite.';
    return 'La compression réduira fortement la taille.';
}