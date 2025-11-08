document.addEventListener('DOMContentLoaded', () => {

    // --- UTILITY: PREFERS REDUCED MOTION CHECK ---
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- AUDIO SETUP ---
    let audioContext, ambientSource, gainNode;
    let isAudioPlaying = false;
    const audioOverlay = document.getElementById('audio-overlay');
    
    function initAudio() {
        if (isAudioPlaying) return;
        
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.2; // Subtle volume
        gainNode.connect(audioContext.destination);

        fetch('https://assets.codepen.io/2621168/projector_hum.mp3')
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                ambientSource = audioContext.createBufferSource();
                ambientSource.buffer = audioBuffer;
                ambientSource.loop = true;
                ambientSource.connect(gainNode);
                ambientSource.start();
                isAudioPlaying = true;
            });
    }

    audioOverlay.addEventListener('click', () => {
        initAudio();
        gsap.to(audioOverlay, {
            opacity: 0,
            duration: 1.5,
            onComplete: () => audioOverlay.style.display = 'none'
        });
        playIntroAnimation();
    }, { once: true });


    // --- SMOOTH SCROLL (LENIS) ---
    const lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);


    // --- CUSTOM CURSOR ---
    const cursor = document.querySelector('.cursor');
    const links = document.querySelectorAll('a, button');

    window.addEventListener('mousemove', e => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            duration: 0.2,
            ease: 'power2.out'
        });
    });

    links.forEach(link => {
        link.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
            if (link.dataset.cursorText) {
                cursor.classList.add('text-mode');
                cursor.setAttribute('data-cursor-text', link.dataset.cursorText);
            }
        });
        link.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
            cursor.classList.remove('text-mode');
            cursor.removeAttribute('data-cursor-text');
        });
    });


    // --- GSAP & THREE.JS SETUP ---
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let scene, camera, renderer, particles, hologram;

    // --- THREE.JS INITIALIZATION ---
    function initThree() {
        const container = document.getElementById('three-bg');
        
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);
        gsap.to(container, { opacity: 1, duration: 2, delay: 1 });

        // Particle Corridor
        const particleCount = 5000;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMaterial = new THREE.PointsMaterial({
            color: '#00E0FF',
            size: 0.02,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Hologram Orb
        const hologramGeometry = new THREE.IcosahedronGeometry(1.5, 3);
        const hologramMaterial = new THREE.MeshBasicMaterial({
            color: '#00E0FF',
            wireframe: true,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });
        hologram = new THREE.Mesh(hologramGeometry, hologramMaterial);
        hologram.visible = false;
        scene.add(hologram);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        animate();
    }

    const mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // Three.js Animate Loop
    function animate() {
        requestAnimationFrame(animate);
        if (particles) {
            particles.rotation.y += 0.0002;
            particles.position.z += lenis.velocity * 0.001; // Move with scroll
            particles.position.z = Math.max(particles.position.z, -10); // Clamp position
        }
        if (hologram && hologram.visible) {
            hologram.rotation.x += 0.001;
            hologram.rotation.y += 0.002;
            hologram.rotation.x += (mouse.y * 0.5 - hologram.rotation.x) * 0.05;
            hologram.rotation.y += (mouse.x * 0.5 - hologram.rotation.y) * 0.05;
        }
        renderer.render(scene, camera);
    }

    initThree();
    
    // --- INTRO & HERO ANIMATION ---
    function playIntroAnimation() {
        if (prefersReducedMotion) {
            gsap.to(['.site-header', '.hero-content .cta-buttons', '.scroll-down-indicator'], { opacity: 1, duration: 1 });
            return;
        }

        const tl = gsap.timeline();
        const split = new SplitText(".tagline", { type: "chars, words" });

        tl.to('#logo-r', { opacity: 0, duration: 0.8, delay: 0.5 })
          .to('#logo-reverie', { x: '50%', textAnchor: 'middle', opacity: 1, duration: 1.2, ease: 'power3.inOut' }, '-=0.5')
          .to('#logo-labs', { x: '50%', textAnchor: 'middle', opacity: 1, duration: 1.2, ease: 'power3.inOut' }, '<')
          .to(['#logo-reverie', '#logo-labs'], {
              x: (i) => i === 0 ? 135 : 145,
              textAnchor: (i) => i === 0 ? 'end' : 'start',
              duration: 1,
              ease: 'power3.inOut'
          }, '+=0.5')
          .to('.site-header', { opacity: 1, duration: 1.5, ease: 'power2.out' }, 0.5);

        gsap.from(split.chars, {
            y: '100%',
            opacity: 0,
            stagger: 0.03,
            duration: 1,
            ease: 'power3.out',
            delay: 1.5
        });

        tl.to('.hero-content .cta-buttons', { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 2.5)
          .to('.scroll-down-indicator', { opacity: 1, duration: 1, ease: 'power3.out' }, 3);
    }

    // --- SCROLL-TRIGGERED ANIMATIONS ---
    
    // Fallback for reduced motion
    if (prefersReducedMotion) {
        gsap.utils.toArray('.scene > *').forEach(el => {
            gsap.to(el, {
                opacity: 1,
                scrollTrigger: { trigger: el, start: 'top 80%' }
            });
        });
        hologram.visible = true;
        hologram.material.opacity = 0.5;
        return;
    }
    
    // Scene 2: Vision
    const visionTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.vision',
            start: 'top top',
            end: '+=150%',
            scrub: 1,
            pin: true,
        }
    });
    visionTl.to('.quote', { opacity: 1, duration: 2, ease: 'power2.inOut' })
            .to('.quote', { opacity: 0, duration: 1, ease: 'power2.in' }, '+=2');

    // Scene 3: Ecosystem
    const ecosystemTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.ecosystem',
            start: 'top center',
            end: 'bottom center',
            scrub: true,
            onEnter: () => {
                hologram.visible = true;
                lenis.stop();
                gsap.to(camera.position, {z: 3, duration: 1.5, ease: 'power3.inOut', onComplete: () => lenis.start()});
            },
            onLeaveBack: () => {
                lenis.stop();
                gsap.to(camera.position, {z: 5, duration: 1.5, ease: 'power3.inOut', onComplete: () => {
                    hologram.visible = false;
                    lenis.start();
                }});
            }
        }
    });
    ecosystemTl.to(hologram.material, { opacity: 0.7, duration: 1 })
               .to('.ecosystem-content', { opacity: 1, duration: 1 }, 0.5)
               .to([hologram.material, '.ecosystem-content'], { opacity: 0, duration: 1 }, "+=2");

    // Scene 4: Films
    gsap.from('.films .section-title', {
        opacity: 0,
        y: 50,
        scrollTrigger: { trigger: '.films', start: 'top 70%' }
    });
    gsap.from('.film-card', {
        opacity: 0,
        y: 100,
        stagger: 0.2,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
            trigger: '.film-grid',
            start: 'top 80%'
        }
    });

    // Scene 5: Community
    const communityTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.community',
            start: 'top 60%'
        }
    });
    communityTl.from('.community .section-title', { opacity: 0, y: 50 })
               .from('.community-subtitle', { opacity: 0, y: 30 }, '-=0.2')
               .from('.creator-silhouettes', { opacity: 0, scale: 0.8 }, '-=0.2')
               .from('.community .btn', { opacity: 0, y: 20 }, '-=0.2');

    // Scene 6: Footer Credits
    const footerTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.site-footer-credits',
            start: 'top 50%',
        }
    });

    const creditLines = document.querySelectorAll('.credit-line');
    const creditsToAnimate = Array.from(creditLines).map(line => {
        return [line.children[0], line.children[1]];
    }).flat();

    footerTl.to('.credits-roll', { opacity: 1, duration: 1 })
            .from(creditsToAnimate, {
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out'
            }, '+=0.5')
            .to('.footer-links', { opacity: 1, duration: 1 }, '-=0.5')
            .to('.copyright', { opacity: 1, duration: 1 }, '-=0.5');
});
