document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const bubbleCountElement = document.getElementById('count');

    // Set canvas to full container size
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game variables
    let bubbles = [];
    let poppedCount = 0;
    let lastTime = 0;
    let animationId;

    // Bubble class
    class Bubble {
        constructor(x, y) {
            this.x = x || Math.random() * canvas.width;
            this.y = y || canvas.height + 50;
            this.radius = 20 + Math.random() * 30;
            this.speed = 1 + Math.random() * 2;
            this.color = this.getRandomColor();
            this.opacity = 0.7 + Math.random() * 0.3;
            this.popping = false;
            this.popProgress = 0;
            this.showFace = Math.random() > 0.7; // 30% chance to show face after pop
        }

        getRandomColor() {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#FFD166', '#118AB2',
                '#06D6A0', '#EF476F', '#9B5DE5', '#00BBF9'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            if (this.popping) {
                this.popProgress += 0.1;
                if (this.popProgress >= 1) {
                    // Bubble is fully popped
                    const index = bubbles.indexOf(this);
                    if (index > -1) {
                        bubbles.splice(index, 1);
                        poppedCount++;
                        bubbleCountElement.textContent = poppedCount;

                        // Add a new bubble to replace the popped one
                        addBubble();
                    }
                }
            } else {
                this.y -= this.speed;

                // If bubble goes off screen, reset it
                if (this.y < -this.radius) {
                    this.y = canvas.height + this.radius;
                    this.x = Math.random() * canvas.width;
                }
            }
        }

        draw() {
            if (this.popping) {
                // Draw popping animation
                ctx.save();
                ctx.globalAlpha = this.opacity * (1 - this.popProgress);

                // Draw expanding rings
                for (let i = 0; i < 3; i++) {
                    const ringRadius = this.radius * (1 + this.popProgress * 2 + i * 0.5);
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, ringRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = this.color;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Draw small particles
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const distance = this.radius * this.popProgress * 2;
                    const particleX = this.x + Math.cos(angle) * distance;
                    const particleY = this.y + Math.sin(angle) * distance;

                    ctx.beginPath();
                    ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
                    ctx.fillStyle = this.color;
                    ctx.fill();
                }

                // Draw face if applicable
                if (this.showFace && this.popProgress > 0.5) {
                    ctx.globalAlpha = (this.popProgress - 0.5) * 2;
                    this.drawFace(this.x, this.y);
                }

                ctx.restore();
            } else {
                // Draw normal bubble
                ctx.save();
                ctx.globalAlpha = this.opacity;

                // Bubble body
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Bubble highlight
                ctx.beginPath();
                ctx.arc(
                    this.x - this.radius * 0.3,
                    this.y - this.radius * 0.3,
                    this.radius * 0.2, 0, Math.PI * 2
                );
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();

                ctx.restore();
            }
        }

        drawFace(x, y) {
            const faceSize = this.radius * 0.8;

            // Face circle
            ctx.beginPath();
            ctx.arc(x, y, faceSize, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD166';
            ctx.fill();
            ctx.strokeStyle = '#FF9E4A';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x - faceSize * 0.3, y - faceSize * 0.2, faceSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + faceSize * 0.3, y - faceSize * 0.2, faceSize * 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Smile
            ctx.beginPath();
            ctx.arc(x, y + faceSize * 0.1, faceSize * 0.4, 0, Math.PI);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        isPointInside(x, y) {
            const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
            return distance <= this.radius;
        }

        pop() {
            if (!this.popping) {
                this.popping = true;
                playPopSound();
            }
        }
    }

    // Create initial bubbles
    function createBubbles(count) {
        for (let i = 0; i < count; i++) {
            addBubble();
        }
    }

    function addBubble() {
        bubbles.push(new Bubble());
    }

    // Pop sound effect
    function playPopSound() {
        // Create a simple pop sound using the Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            console.log("Audio context not supported");
        }
    }

    // Game loop
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        // Clear canvas with a soft blue background
        ctx.fillStyle = 'rgba(224, 247, 255, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Update and draw bubbles
        bubbles.forEach(bubble => {
            bubble.update();
            bubble.draw();
        });

        animationId = requestAnimationFrame(gameLoop);
    }

    // Handle touch events
    function handleTap(event) {
        event.preventDefault();

        // Get touch position
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        let clientX, clientY;

        if (event.type === 'touchstart' || event.type === 'touchmove') {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        // Check if any bubble was tapped
        for (let i = bubbles.length - 1; i >= 0; i--) {
            if (bubbles[i].isPointInside(x, y)) {
                bubbles[i].pop();
                break;
            }
        }
    }

    // Shake detection for adding more bubbles
    let lastShakeTime = 0;
    const SHAKE_THRESHOLD = 15;
    let lastX = null, lastY = null, lastZ = null;

    function handleDeviceMotion(event) {
        const acceleration = event.accelerationIncludingGravity;
        const currentTime = Date.now();

        if ((currentTime - lastShakeTime) > 1000) {
            const deltaX = Math.abs(acceleration.x - lastX);
            const deltaY = Math.abs(acceleration.y - lastY);
            const deltaZ = Math.abs(acceleration.z - lastZ);

            if (deltaX + deltaY + deltaZ > SHAKE_THRESHOLD) {
                // Shake detected - add multiple bubbles
                for (let i = 0; i < 5; i++) {
                    addBubble();
                }
                lastShakeTime = currentTime;
            }

            lastX = acceleration.x;
            lastY = acceleration.y;
            lastZ = acceleration.z;
        }
    }

    // Initialize game
    function init() {
        createBubbles(10);
        lastTime = performance.now();
        gameLoop(lastTime);

        // Event listeners
        canvas.addEventListener('mousedown', handleTap);
        canvas.addEventListener('touchstart', handleTap);

        // Device motion for shake detection
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleDeviceMotion);
        }
    }

    // Start the game
    init();
});