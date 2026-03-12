// ==========================================
// assets/js/main.js
// ==========================================

// --- 1. INTERSECTION OBSERVER (Animazioni allo scroll) ---
document.addEventListener("DOMContentLoaded", () => {
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

// --- 2. MODAL ENGINE E SCROLL LOGIC ---
const modal = document.getElementById('dynamic-modal');
const closeBtn = document.getElementById('modal-close-btn');
const btnReaderMode = document.getElementById('btn-reader-mode');
const compactTitle = document.getElementById('modal-compact-title');
let focusedElementBeforeModal;

if (btnReaderMode && modal && compactTitle) {
    // Toggle Modalità Lettura
    btnReaderMode.addEventListener('click', () => {
        modal.classList.toggle('reader-mode-active');
        btnReaderMode.classList.toggle('active');
    });

    // Effetto scroll per il titolo compatto nel modale
    modal.addEventListener('scroll', () => {
        const mainTitle = document.getElementById('modal-title');
        if (mainTitle) {
            const rect = mainTitle.getBoundingClientRect();
            if (rect.bottom < 60) {
                compactTitle.classList.add('visible');
                mainTitle.style.opacity = '0'; 
            } else {
                compactTitle.classList.remove('visible');
                mainTitle.style.opacity = '1';
            }
        }
    });
}

// Funzione per aprire il modale e caricare i JSON
async function openModal(fileName) {
    if (!modal) return;
    
    focusedElementBeforeModal = document.activeElement; 
    document.body.style.overflow = 'hidden';
    modal.classList.add('active');
    
    // A11Y FIX: Rivela il modale agli screen reader
    modal.setAttribute('aria-hidden', 'false'); 
    
    modal.scrollTo(0, 0); 
    compactTitle.classList.remove('visible'); 
    
    // Resetta la modalità lettura ogni volta che si apre un nuovo documento
    modal.classList.remove('reader-mode-active');
    btnReaderMode.classList.remove('active');
    
    closeBtn.focus(); 

    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const bodyContainer = document.getElementById('modal-body');

    titleEl.innerText = 'Caricamento...';
    titleEl.style.opacity = '1';
    compactTitle.innerText = '';
    descEl.innerText = '';
    bodyContainer.innerHTML = `<div class="spinner-container"><div class="spinner"></div></div>`;

    // Avviso nel modale se si usa file:/// (così sei protetto anche sui JSON)
    if (window.location.protocol === 'file:') {
        titleEl.innerText = 'Avviso Sviluppatore (CORS)';
        descEl.innerText = 'I file esterni non possono essere caricati in locale facendo doppio click.';
        bodyContainer.innerHTML = `
            <div style="background: var(--bg-secondary); padding: 32px; border-radius: 16px;">
                <h3 style="margin-top: 0; color: var(--color-accent);">Usa un server locale:</h3>
                <ul class="dynamic-list">
                    <li>VS Code: Estensione <em>"Live Server"</em></li>
                    <li>Terminale Mac: <code>python3 -m http.server</code></li>
                </ul>
            </div>
        `;
        return;
    }

    try {
        // PERCORSO AGGIORNATO ALLA NUOVA STRUTTURA CARTELLE (assets/json/)
        const response = await fetch(`assets/json/${fileName}.json`);
        if (!response.ok) throw new Error(`HTTP: ${response.status}`);
        const data = await response.json();

        titleEl.innerText = data.title || '';
        compactTitle.innerText = data.title || ''; 
        descEl.innerText = data.description || '';
        bodyContainer.innerHTML = ''; 

        if (data.body && Array.isArray(data.body)) {
            data.body.forEach(block => {
                if (fileName === 'faq' && block.type === 'paragraph') {
                    const details = document.createElement('details');
                    if(block === data.body[0]) details.setAttribute('open', true);
                    details.innerHTML = `<summary>${block.title}</summary><div class="details-content"><p>${block.text}</p></div>`;
                    bodyContainer.appendChild(details);
                } else {
                    if (block.type === 'paragraph') {
                        if (block.title) {
                            const h3 = document.createElement('h3');
                            h3.innerText = block.title;
                            bodyContainer.appendChild(h3);
                        }
                        const p = document.createElement('p');
                        p.innerText = block.text;
                        bodyContainer.appendChild(p);
                    } else if (block.type === 'cit') {
                        const div = document.createElement('div');
                        div.className = 'dynamic-quote';
                        div.innerHTML = `<p>"${block.text}"</p>`;
                        if (block.person) div.innerHTML += `<span>- ${block.person}</span>`;
                        bodyContainer.appendChild(div);
                    } else if (block.type === 'list') {
                        const ul = document.createElement('ul');
                        ul.className = 'dynamic-list';
                        if (block.items) {
                            block.items.forEach(item => {
                                const li = document.createElement('li');
                                li.innerHTML = `<strong>${item.title}</strong> ${item.description}`;
                                ul.appendChild(li);
                            });
                        }
                        bodyContainer.appendChild(ul);
                    }
                }
            });
        }
    } catch (error) {
        titleEl.innerText = 'Ops!';
        descEl.innerText = 'Impossibile caricare il contenuto.';
        bodyContainer.innerHTML = '<p>Verifica la tua connessione o il nome del file.</p>';
        console.error("Errore caricamento JSON:", error);
    }
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    
    // A11Y FIX: Nasconde nuovamente il modale agli screen reader
    modal.setAttribute('aria-hidden', 'true'); 
    
    document.body.style.overflow = '';
    if (focusedElementBeforeModal) focusedElementBeforeModal.focus(); 
}

// Inizializza Listeners (assicurati che il DOM sia pronto prima di agganciarli)
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', () => openModal(trigger.dataset.modal));
        trigger.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(trigger.dataset.modal);
            }
        });
    });
    
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', (e) => { 
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal(); 
        }
    });
});

// --- INTERSECTION OBSERVER PER PRODUCT TOUR (FADE SCROLL) ---
document.addEventListener("DOMContentLoaded", () => {
    const tourSteps = document.querySelectorAll('.tour-step');
    const tourImages = document.querySelectorAll('.tour-img');

    if (tourSteps.length > 0 && tourImages.length > 0) {
        // Opzioni: Trigger quando l'elemento arriva a metà schermo
        const tourOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        };

        const tourObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const currentStep = entry.target;
                    const stepIndex = currentStep.getAttribute('data-step');

                    // 1. Spegni tutti i testi e le immagini
                    tourSteps.forEach(s => s.classList.remove('is-active'));
                    tourImages.forEach(i => i.classList.remove('active'));

                    // 2. Accendi il testo e l'immagine correnti
                    currentStep.classList.add('is-active');
                    const targetImg = document.querySelector(`.tour-img[data-image="${stepIndex}"]`);
                    if (targetImg) targetImg.classList.add('active');
                }
            });
        }, tourOptions);

        tourSteps.forEach(step => tourObserver.observe(step));
    }
});

// --- SPOTLIGHT EFFECT PER BENTO CARDS ---
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.bento-glass-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });
});

// --- 3D CARD STACKING DEPTH EFFECT ---
document.addEventListener("DOMContentLoaded", () => {
    const stackCards = document.querySelectorAll('.stack-card');
    
    if (stackCards.length > 0) {
        window.addEventListener('scroll', () => {
            stackCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                // Calcola quanto la card è vicina alla cima dello schermo (quando si blocca)
                const distanceFromTop = rect.top;
                
                // Se la card è bloccata in alto e ce n'è un'altra che le sta scorrendo sopra
                if (distanceFromTop <= 180) { // 180px è circa la zona di sticky
                    // Calcola una scala dinamica basata sullo scroll
                    // Più scorri giù, più la card si rimpicciolisce (fino a 0.9) e si scurisce
                    const scaleValue = Math.max(0.9, 1 - (180 - distanceFromTop) * 0.001);
                    const brightnessValue = Math.max(0.4, 1 - (180 - distanceFromTop) * 0.003);
                    
                    card.style.transform = `scale(${scaleValue})`;
                    card.style.filter = `brightness(${brightnessValue})`;
                } else {
                    // Reset quando scorri verso l'alto
                    card.style.transform = `scale(1)`;
                    card.style.filter = `brightness(1)`;
                }
            });
        }, { passive: true });
    }
});
// ==========================================
// UX PREMIUM FISICHE (OTTIMIZZATO 60FPS)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    // Controlla se l'utente è su un dispositivo touch (Mobile/Tablet)
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    // 1. MAGNETIC 3D MOCKUP (Solo per Mouse/Desktop)
    if (!isTouchDevice) {
        const mockupFrame = document.getElementById('magnetic-mockup');
        const heroSection = document.querySelector('.hero-spatial');
        
        if (mockupFrame && heroSection) {
            let rafId = null;
            let targetX = 0, targetY = 0;

            heroSection.addEventListener('mousemove', (e) => {
                // Calcolo fluido
                targetX = (window.innerWidth / 2 - e.pageX) / 70;
                targetY = (window.innerHeight / 2 - e.pageY) / 70;

                // Annulla frame precedenti
                if (rafId) cancelAnimationFrame(rafId);
                
                rafId = requestAnimationFrame(() => {
                    mockupFrame.style.transform = `rotateY(${targetX}deg) rotateX(${10 + targetY}deg) translateY(20px)`;
                });
            });

            heroSection.addEventListener('mouseleave', () => {
                if (rafId) cancelAnimationFrame(rafId);
                mockupFrame.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                mockupFrame.style.transform = `rotateX(10deg) translateY(20px)`;
            });

            heroSection.addEventListener('mouseenter', () => {
                mockupFrame.style.transition = 'none';
            });
        }
    }

    // 2. SPOTLIGHT EFFECT SULLE CARD BENTO (Solo Desktop)
    if (!isTouchDevice) {
        const bentoCards = document.querySelectorAll('.bento-glass-card');
        
        bentoCards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                requestAnimationFrame(() => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty('--x', `${x}px`);
                    card.style.setProperty('--y', `${y}px`);
                });
            });
        });
    }

    // 3. EFFETTO PROFONDITÀ (STACKING CARDS)
    const stackCards = document.querySelectorAll('.stack-card');
    
    // Lo attiviamo solo se lo schermo è > 980px (dove lo stacking è attivo in CSS)
    if (stackCards.length > 0 && window.innerWidth > 980) {
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    stackCards.forEach((card) => {
                        const rect = card.getBoundingClientRect();
                        const distanceFromTop = rect.top;
                        
                        // Il valore 200 dipende dall'offset sticky
                        if (distanceFromTop <= 200) { 
                            const scaleValue = Math.max(0.92, 1 - (200 - distanceFromTop) * 0.0006);
                            const brightnessValue = Math.max(0.4, 1 - (200 - distanceFromTop) * 0.0025);
                            
                            // Applica trasformazioni separate per GPU
                            card.style.transform = `scale(${scaleValue}) translateZ(0)`;
                            card.style.filter = `brightness(${brightnessValue})`;
                        } else {
                            card.style.transform = `scale(1) translateZ(0)`;
                            card.style.filter = `brightness(1)`;
                        }
                    });
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    }
});

// ==========================================
// SCROLL-DRIVEN HERO MOCKUP (Calibrazione Perfetta)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const heroMockup = document.getElementById('scroll-mockup');
    const heroWrapper = document.getElementById('hero-hardware-wrapper');
    
    if (heroMockup && heroWrapper) {
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    const scrollProgress = Math.min(scrollY / (window.innerHeight * 0.8), 1);
                    
                    if (scrollProgress < 1) {
                        // Inclinazione più dolce
                        const rotateX = 12 + (scrollProgress * 15); 
                        // Sprofonda meno e più lentamente (da 150px a 60px max)
                        const translateY = scrollProgress * 60; 
                        // Scaling leggerissimo
                        const scale = 1 - (scrollProgress * 0.03); 
                        
                        // Il wrapper perde opacità in modo molto più graduale
                        heroWrapper.style.opacity = 1 - (scrollProgress * 1.2);
                        
                        heroMockup.style.transform = `scale(${scale}) rotateX(${rotateX}deg) translateY(${translateY}px) translateZ(0)`;
                    } else {
                        // Quando ha superato la soglia, lo nascondiamo per non pesare sul rendering
                        heroWrapper.style.opacity = 0;
                    }
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    }
});

// ==========================================
// FISICA AVANZATA E MICRO-ANIMAZIONI
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. EFFETTO NEBBIA (MANIFESTO) ---
    // Ricicliamo l'Intersection Observer del tuo main.js, 
    // ma lo applichiamo anche alla classe .blur-reveal
    const blurElements = document.querySelectorAll('.blur-reveal');
    const blurObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                blurObserver.unobserve(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -15% 0px' });

    blurElements.forEach(el => blurObserver.observe(el));


    // --- 2. PROFONDITÀ DI CAMPO (STACKING CARDS + BLUR) ---
    const stackCards = document.querySelectorAll('.stack-card');
    
    if (stackCards.length > 0 && window.innerWidth > 980) {
        let isScrolling = false;

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    stackCards.forEach((card) => {
                        const rect = card.getBoundingClientRect();
                        const distanceFromTop = rect.top;
                        
                        // Quando la card si ferma e viene superata
                        if (distanceFromTop <= 200) { 
                            const scrollDepth = 200 - distanceFromTop;
                            
                            // Scale e Brightness come prima
                            const scaleValue = Math.max(0.92, 1 - scrollDepth * 0.0006);
                            const brightnessValue = Math.max(0.4, 1 - scrollDepth * 0.0025);
                            
                            // LA MAGIA: Depth of field (Blur) proporzionale
                            // Più scorri in giù, più la card in background si sfoca (fino a 6px max)
                            const blurValue = Math.min(6, scrollDepth * 0.03);
                            
                            card.style.transform = `scale(${scaleValue}) translateZ(0)`;
                            card.style.filter = `brightness(${brightnessValue}) blur(${blurValue}px)`;
                        } else {
                            // Card in primo piano: nitida e grandezza normale
                            card.style.transform = `scale(1) translateZ(0)`;
                            card.style.filter = `brightness(1) blur(0px)`;
                        }
                    });
                    isScrolling = false;
                });
                isScrolling = true;
            }
        }, { passive: true });
    }

    // --- 3. CONTATORE NUMERI (METRICHE) ---
    const counters = document.querySelectorAll('.counter');
    const speed = 60; // Più basso è, più è veloce

    const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseFloat(counter.getAttribute('data-target'));
                const isFloat = target % 1 !== 0; // Controlla se è 28.5 o 110
                
                const updateCount = () => {
                    const current = parseFloat(counter.innerText);
                    // Calcola l'incremento
                    const inc = target / speed;

                    if (current < target) {
                        counter.innerText = (current + inc).toFixed(isFloat ? 1 : 0);
                        requestAnimationFrame(updateCount);
                    } else {
                        counter.innerText = target;
                        // Aggiunge la classe 'done' al parent per mostrare la "L" di lode
                        counter.parentElement.classList.add('done');
                    }
                };

                updateCount();
                observer.unobserve(counter); // Anima solo la prima volta
            }
        });
    }, { threshold: 0.5 }); // Parte quando il numero è a metà schermo

    counters.forEach(counter => counterObserver.observe(counter));
});