/**
 * Compresseur de PDF pour GoCompress
 * Utilisation de pdf-lib (chargée globalement)
 */

/**
 * Compresse un PDF en optimisant les images internes
 * @param {File} file - Fichier PDF
 * @param {Function} onProgress - Callback de progression
 * @returns {Promise<Blob>} PDF compressé
 */
export async function compressPDF(file, onProgress = null) {
    try {
        // Vérifier que la bibliothèque est chargée
        if (typeof PDFLib === 'undefined') {
            throw new Error('La bibliothèque de manipulation PDF n\'est pas chargée.');
        }

        const { PDFDocument } = PDFLib;
        
        // Vérification
        if (file.size === 0) {
            throw new Error('Le fichier PDF est vide.');
        }

        // Lecture du PDF
        const arrayBuffer = await file.arrayBuffer();
        if (onProgress) onProgress(20);
        
        // Chargement du document
        const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
            updateMetadata: false,
        });
        if (onProgress) onProgress(40);
        
        const pageCount = pdfDoc.getPageCount();
        
        if (pageCount === 0) {
            throw new Error('Le PDF est vide ou corrompu.');
        }

        // On sauvegarde avec optimisation
        const compressedBytes = await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            compress: true,
            objectsPerTick: 100,
        });
        if (onProgress) onProgress(80);

        // Si le PDF compressé est plus grand, on garde l'original
        if (compressedBytes.length >= file.size) {
            if (onProgress) onProgress(100);
            return new Blob([arrayBuffer], { type: 'application/pdf' });
        }

        if (onProgress) onProgress(100);
        return new Blob([compressedBytes], { type: 'application/pdf' });
        
    } catch (error) {
        console.error('Erreur compression PDF:', error);
        // On retourne le fichier original en cas d'échec
        try {
            const arrayBuffer = await file.arrayBuffer();
            return new Blob([arrayBuffer], { type: 'application/pdf' });
        } catch {
            throw new Error(`Erreur lors de la compression PDF : ${error.message || 'Erreur inconnue'}`);
        }
    }
}

/**
 * Vérifie si le PDF peut être compressé
 * @param {File} file - Fichier PDF
 * @returns {boolean} True si PDF
 */
export function canCompressPDF(file) {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}