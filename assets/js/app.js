/**
 * Application principale GoCompress
 * Point d'entrée de l'application
 */

import { UI } from './ui.js';

class GoCompress {
    constructor() {
        this.ui = null;
        this.init();
    }

    init() {
        try {
            console.log('🚀 GoCompress - Version 1.0');
            console.log('👤 Créé par Ayang Douswe');
            console.log('📄 Licence MIT');
            
            this.ui = new UI();
            
            console.log('Application prête');
        } catch (error) {
            console.error('Erreur d\'initialisation:', error);
            alert('Une erreur est survenue lors du chargement de l\'application.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new GoCompress();
    window.__GOCORMPRESS = app;
});