/**
 * Compresseur d'images pour GoCompress
 * Utilisation de la bibliothèque browser-image-compression (chargée globalement)
 */

/**
 * Compresse une image
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

        // Paramètres de compression
        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: 4096,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: quality / 100,
            onProgress: (progress) => {
                if (onProgress) {
                    onProgress(Math.round(progress));
                }
            }
        };

        // Compression
        const compressedFile = await imageCompression(file, options);
        
        // Vérification du résultat
        if (!compressedFile || compressedFile.size === 0) {
            throw new Error('La compression a échoué.');
        }

        return compressedFile;
        
    } catch (error) {
        console.error('Erreur compression image:', error);
        throw new Error(`Erreur lors de la compression : ${error.message || 'Erreur inconnue'}`);
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

        const options = {
            maxSizeMB: 10,
            maxWidthOrHeight: 4096,
            useWebWorker: true,
            fileType: 'image/webp',
            initialQuality: quality / 100,
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

        return compressedFile;
        
    } catch (error) {
        console.error('Erreur compression WebP:', error);
        throw new Error(`Erreur lors de la conversion WebP : ${error.message || 'Erreur inconnue'}`);
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