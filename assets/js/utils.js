/**
 * Utilitaires pour GoCompress
 */

/**
 * Formate un nombre d'octets en unité lisible (Ko, Mo, Go)
 * @param {number} bytes - Taille en octets
 * @param {number} decimals - Nombre de décimales
 * @returns {string} Taille formatée
 */
export function formatSize(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = (bytes / Math.pow(k, i)).toFixed(dm);
    return `${size} ${sizes[i]}`;
}

/**
 * Génère un identifiant unique
 * @returns {string} ID unique
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
}

/**
 * Vérifie si un fichier est une image
 * @param {File} file - Fichier à vérifier
 * @returns {boolean} True si image
 */
export function isImageFile(file) {
    const imageTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff'];
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return imageTypes.includes(file.type) || imageExtensions.includes(ext);
}

/**
 * Vérifie si un fichier est un PDF
 * @param {File} file - Fichier à vérifier
 * @returns {boolean} True si PDF
 */
export function isPDFFile(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Obtient l'extension d'un fichier
 * @param {string} filename - Nom du fichier
 * @returns {string} Extension (sans le point)
 */
export function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

/**
 * Obtient le nom sans extension
 * @param {string} filename - Nom du fichier
 * @returns {string} Nom sans extension
 */
export function getFileNameWithoutExtension(filename) {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Vérifie si une valeur est dans un intervalle
 * @param {number} value - Valeur à vérifier
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {boolean} True si dans l'intervalle
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Délai pour les animations
 * @param {number} ms - Millisecondes
 * @returns {Promise} Promesse résolue après le délai
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validation du type MIME (sécurité)
 * @param {File} file - Fichier à valider
 * @returns {boolean} True si valide
 */
export function isValidFileType(file) {
    const validTypes = [
        'image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/tiff',
        'application/pdf'
    ];
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.pdf'];
    const ext = '.' + getFileExtension(file.name);
    return validTypes.includes(file.type) || validExtensions.includes(ext);
}

/**
 * Taille maximale raisonnable (50 Mo)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Mo

/**
 * Types de fichiers supportés avec leur icône
 */
export const FILE_TYPES = {
    image: {
        icon: 'fa-image',
        color: '#22C55E',
        label: 'Image'
    },
    pdf: {
        icon: 'fa-file-pdf',
        color: '#EF4444',
        label: 'PDF'
    },
    unknown: {
        icon: 'fa-file',
        color: '#94A3B8',
        label: 'Fichier'
    }
};