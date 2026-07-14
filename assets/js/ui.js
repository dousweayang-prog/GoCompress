/**
 * Gestion de l'interface utilisateur pour GoCompress
 */

import { formatSize, getFileExtension, isImageFile, isPDFFile } from './utils.js';

export class UI {
    constructor() {
        // Éléments DOM
        this.dropZone = document.getElementById('drop-zone');
        this.fileInput = document.getElementById('file-input');
        this.fileInfo = document.getElementById('file-info');
        this.fileName = document.getElementById('file-name');
        this.fileSize = document.getElementById('file-size');
        this.fileType = document.getElementById('file-type');
        this.resultPanel = document.getElementById('result-panel');
        this.sizeBefore = document.getElementById('size-before');
        this.sizeAfter = document.getElementById('size-after');
        this.sizeSaved = document.getElementById('size-saved');
        this.downloadBtn = document.getElementById('download-btn');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.pageOverlay = document.getElementById('page-overlay');
        this.modalGlass = document.querySelector('.modal-glass');
        this.modalTitle = document.getElementById('modal-title');
        this.modalFilename = document.getElementById('modal-filename');
        this.modalProgressFill = document.getElementById('modal-progress-fill');
        this.modalProgressText = document.getElementById('modal-progress-text');
        this.modalDownloadBtn = document.getElementById('modal-download-btn');
        this.modalRetryBtn = document.getElementById('modal-retry-btn');
        this.modalCloseBtn = document.getElementById('modal-close-btn');
        this.modalSpinner = document.querySelector('.modal-spinner');
        this.modalCheckmark = document.querySelector('.modal-checkmark');
        this.modalResults = document.getElementById('modal-results');
        this.modalSizeBefore = document.getElementById('modal-size-before');
        this.modalSizeAfter = document.getElementById('modal-size-after');
        this.modalSizeSaved = document.getElementById('modal-size-saved');
        
        // État
        this.compressedFile = null;
        this.originalFile = null;
        this.isProcessing = false;
        this.selectedType = null; // 'image' ou 'pdf'
        
        // Initialisation
        this.initUI();
    }

    /**
     * Initialise les événements UI
     */
    initUI() {
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => this.handleMenuClick(item));
        });

        // Drop zone (accepte tous les fichiers)
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('dragover');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('dragover');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // Click sur la drop zone
        this.dropZone.addEventListener('click', () => {
            if (!this.isProcessing) {
                this.fileInput.click();
            }
        });

        // Bouton "Choisir un fichier"
        document.getElementById('file-select-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isProcessing) {
                this.fileInput.click();
            }
        });

        // File input (accepte tout)
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files.length > 0) {
                this.handleFile(this.fileInput.files[0]);
            }
            this.fileInput.value = '';
        });

        // Download button (principal)
        this.downloadBtn.addEventListener('click', () => this.downloadFile());

        // Modal download
        this.modalDownloadBtn.addEventListener('click', () => {
            this.downloadFile();
            // Après téléchargement, on cache le bouton télécharger et on montre fermer
            this.modalDownloadBtn.style.display = 'none';
            this.modalCloseBtn.style.display = 'inline-flex';
        });

        // Modal retry
        this.modalRetryBtn.addEventListener('click', () => {
            this.closeModal();
            this.resetUI();
        });

        // Modal close
        this.modalCloseBtn.addEventListener('click', () => {
            this.closeModal();
            this.resetUI();
        });

        // FAQ Accordion
        document.querySelectorAll('.faq-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const answer = btn.nextElementSibling;
                const isOpen = answer.classList.contains('open');
                
                // Fermer les autres
                document.querySelectorAll('.faq-answer').forEach(a => {
                    a.classList.remove('open');
                    a.style.maxHeight = '0';
                });
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('open');
                });

                if (!isOpen) {
                    answer.classList.add('open');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                    btn.classList.add('open');
                }
            });
        });
    }

    /**
     * Gère le clic sur un menu
     */
    handleMenuClick(item) {
        const type = item.dataset.type;
        if (this.isProcessing) return;

        // Définir le type sélectionné
        this.selectedType = type;
        
        // Configurer l'accept du file input
        if (type === 'image') {
            this.fileInput.accept = '.png,.jpg,.jpeg,.webp,.bmp,.tiff';
        } else if (type === 'pdf') {
            this.fileInput.accept = '.pdf';
        } else {
            this.fileInput.accept = ''; // tous les fichiers
        }
        
        // Ouvrir le sélecteur de fichier
        this.fileInput.click();
    }

    /**
     * Gère un fichier sélectionné
     */
    handleFile(file) {
        if (this.isProcessing) return;
        
        // Validation de la taille
        if (file.size > 50 * 1024 * 1024) {
            this.showError('Le fichier dépasse la taille maximale de 50 Mo.');
            return;
        }

        // Détection du type
        const isImage = isImageFile(file);
        const isPDF = isPDFFile(file);

        // Si l'utilisateur a cliqué sur "Compresser les images"
        if (this.selectedType === 'image' && !isImage) {
            this.showError('Veuillez sélectionner une image (PNG, JPG, JPEG, WebP, BMP, TIFF).');
            return;
        }

        // Si l'utilisateur a cliqué sur "Compresser les PDF"
        if (this.selectedType === 'pdf' && !isPDF) {
            this.showError('Veuillez sélectionner un fichier PDF.');
            return;
        }

        // Si aucun type sélectionné, on auto-détecte
        if (!this.selectedType) {
            if (!isImage && !isPDF) {
                this.showError('Format non supporté. Utilisez une image (PNG, JPG, WebP) ou un PDF.');
                return;
            }
            this.selectedType = isImage ? 'image' : 'pdf';
        }

        // Stockage
        this.originalFile = file;
        this.compressedFile = null;
        this.resultPanel.style.display = 'none';

        // Affichage des infos
        this.fileInfo.style.display = 'flex';
        this.fileName.textContent = file.name;
        this.fileSize.textContent = formatSize(file.size);
        this.fileType.textContent = isImage ? 'Image' : 'PDF';

        // Mise à jour de l'icône
        const icon = this.fileInfo.querySelector('.file-info-icon i');
        if (isImage) {
            icon.className = 'fas fa-image';
            icon.style.color = '#9CA3AF';
        } else {
            icon.className = 'fas fa-file-pdf';
            icon.style.color = '#9CA3AF';
        }

        // Lancer la compression
        this.startCompression(file);
    }

    /**
     * Lance la compression
     */
    async startCompression(file) {
        this.isProcessing = true;
        const quality = 80;

        // Afficher la modale
        this.showModal();

        try {
            const isImage = isImageFile(file);
            let result;

            if (isImage) {
                const { compressImage } = await import('./imageCompressor.js');
                result = await compressImage(file, quality, (progress) => {
                    this.updateModalProgress(progress);
                });
            } else {
                const { compressPDF } = await import('./pdfCompressor.js');
                result = await compressPDF(file, (progress) => {
                    this.updateModalProgress(progress);
                });
            }

            this.compressedFile = result;

            // Mise à jour des résultats (dans la carte)
            this.sizeBefore.textContent = formatSize(file.size);
            this.sizeAfter.textContent = formatSize(result.size);
            const saved = ((file.size - result.size) / file.size * 100);
            this.sizeSaved.textContent = saved > 0 ? `${saved.toFixed(1)}%` : '< 1%';
            this.resultPanel.style.display = 'block';

            // Mise à jour des résultats (dans la modale)
            this.modalSizeBefore.textContent = formatSize(file.size);
            this.modalSizeAfter.textContent = formatSize(result.size);
            this.modalSizeSaved.textContent = saved > 0 ? `${saved.toFixed(1)}%` : '< 1%';

            // Modale : succès avec checkmark
            this.modalGlass.classList.add('success');
            this.modalTitle.textContent = 'Compression terminée !';
            this.modalProgressText.textContent = 'Fichier prêt à être téléchargé.';
            this.modalProgressFill.style.width = '100%';
            this.modalDownloadBtn.style.display = 'inline-flex';
            this.modalRetryBtn.style.display = 'none';
            this.modalCloseBtn.style.display = 'none';
            this.modalResults.style.display = 'block';

        } catch (error) {
            console.error(error);
            this.modalTitle.textContent = 'Erreur';
            this.modalProgressText.textContent = error.message || 'Une erreur est survenue.';
            this.modalDownloadBtn.style.display = 'none';
            this.modalRetryBtn.style.display = 'inline-flex';
            this.modalCloseBtn.style.display = 'inline-flex';
            this.modalProgressFill.style.width = '0%';
            this.modalResults.style.display = 'none';
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Affiche la modale
     */
    showModal() {
        this.pageOverlay.classList.add('active');
        this.modalOverlay.classList.add('active');
        this.modalGlass.classList.remove('success');
        this.modalTitle.textContent = 'Compression en cours...';
        this.modalFilename.textContent = `Fichier : ${this.originalFile.name}`;
        this.modalProgressFill.style.width = '0%';
        this.modalProgressText.textContent = '0%';
        this.modalDownloadBtn.style.display = 'none';
        this.modalRetryBtn.style.display = 'none';
        this.modalCloseBtn.style.display = 'none';
        this.modalCheckmark.classList.remove('show');
        this.modalResults.style.display = 'none';
    }

    /**
     * Ferme la modale
     */
    closeModal() {
        this.pageOverlay.classList.remove('active');
        this.modalOverlay.classList.remove('active');
        this.modalGlass.classList.remove('success');
        this.modalCheckmark.classList.remove('show');
    }

    /**
     * Met à jour la progression de la modale
     */
    updateModalProgress(value) {
        const percent = Math.min(value, 100);
        this.modalProgressFill.style.width = `${percent}%`;
        this.modalProgressText.textContent = `${Math.round(percent)}%`;
        
        if (percent < 30) {
            this.modalTitle.textContent = 'Préparation...';
        } else if (percent < 60) {
            this.modalTitle.textContent = 'Compression en cours...';
        } else if (percent < 90) {
            this.modalTitle.textContent = 'Finalisation...';
        } else {
            this.modalTitle.textContent = 'Presque fini...';
        }
    }

    /**
     * Télécharge le fichier compressé
     */
    downloadFile() {
        if (!this.compressedFile) return;
        
        const url = URL.createObjectURL(this.compressedFile);
        const a = document.createElement('a');
        a.href = url;
        
        const originalName = this.originalFile.name;
        const ext = getFileExtension(originalName);
        const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        a.download = `${baseName}-compressé.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }

    /**
     * Réinitialise l'interface
     */
    resetUI() {
        this.fileInfo.style.display = 'none';
        this.resultPanel.style.display = 'none';
        this.compressedFile = null;
        this.originalFile = null;
        this.dropZone.classList.remove('dragover');
        this.isProcessing = false;
        this.selectedType = null;
        this.fileInput.accept = '';
    }

    /**
     * Affiche une erreur
     */
    showError(message) {
        alert(`❌ ${message}`);
    }
}