        // Global variables
        let webcamStream = null;
        let audioContext = null;
        let analyser = null;
        let microphone = null;
        let authData = {
            face: false,
            voice: false,
            fingerprint: false,
            attempts: 0,
            failures: 0,
            threats: 0,
            vulnerabilities: 0
        };

        // Cybersecurity data
        let cyberData = {
            attacksDetected: 0,
            vulnerabilities: [],
            networkTraffic: [],
            encryptionStatus: 'SECURE',
            threatLevel: 'LOW'
        };

        let modalWebcamStream = null;

        // Initialize the system
        async function initializeSystem() {
            await initializeWebcam();
            await initializeAudio();
            createVoiceVisualizer();
            logActivity('System initialized', 'success');
        }

        // Initialize webcam
        async function initializeWebcam() {
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 640, height: 480 } 
                });
                document.getElementById('webcam').srcObject = webcamStream;
                updateStatus('faceStatus', 'Ready for facial recognition', 'waiting');
                logActivity('Webcam initialized successfully', 'success');
            } catch (error) {
                updateStatus('faceStatus', 'Camera access denied', 'error');
                logActivity('Failed to initialize webcam: ' + error.message, 'error');
            }
        }

        // Initialize audio
        async function initializeAudio() {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                microphone = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                microphone.connect(analyser);
                logActivity('Microphone initialized successfully', 'success');
            } catch (error) {
                updateStatus('voiceStatus', 'Microphone access denied', 'error');
                logActivity('Failed to initialize microphone: ' + error.message, 'error');
            }
        }

        // Create voice visualizer
        function createVoiceVisualizer() {
            const voiceBars = document.getElementById('voiceBars');
            for (let i = 0; i < 32; i++) {
                const bar = document.createElement('div');
                bar.className = 'voice-bar';
                bar.style.height = '10px';
                voiceBars.appendChild(bar);
            }
        }

        // Update voice visualizer
        function updateVoiceVisualizer() {
            if (!analyser) return;
            
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            
            const bars = document.querySelectorAll('.voice-bar');
            bars.forEach((bar, index) => {
                const height = (dataArray[index] / 255) * 80;
                bar.style.height = Math.max(height, 2) + 'px';
            });
        }

        // --- Enhanced Face Authentication with Mode Toggle ---
        // Update mode label on toggle
        const faceModeToggle = document.getElementById('faceModeToggle');
        const faceModeLabel = document.getElementById('faceModeLabel');
        if (faceModeToggle && faceModeLabel) {
            faceModeToggle.addEventListener('change', function() {
                faceModeLabel.textContent = this.checked ? 'Real Backend' : 'Simulation';
            });
        }

        // Enhanced startFaceAuth
        async function startFaceAuth() {
            const useBackend = document.getElementById('faceModeToggle')?.checked;
            if (useBackend) {
                // Real backend recognition
                const image = getWebcamBase64();
                showResultPopup(true, 'Recognizing...', { type: 'info' });
                try {
                    const res = await fetch('http://127.0.0.1:5000/recognize_face', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image })
                    });
                    const data = await res.json();
                    if (data.success) {
                        if (data.name && data.name !== 'Unknown') {
                            // You can add more fields to registration and show them here if available
                            showResultPopup(
                                true,
                                'Face Recognized!',
                                {
                                    summary: `👤 <b>${data.name}</b> recognized!`,
                                    findings: [
                                        `Confidence: ${data.confidence ? data.confidence.toFixed(2) : 'N/A'}`
                                        // Add more details here if your backend returns them
                                    ],
                                    tip: 'Welcome back, ' + data.name + '!',
                                    type: 'success',
                                    features: []
                                }
                            );
                        } else {
                            showResultPopup(
                                false,
                                'Face Not Recognized',
                                {
                                    summary: 'No match found in the database.',
                                    findings: [],
                                    tip: 'Try registering your face first or improve lighting/position.',
                                    type: 'failure',
                                    features: []
                                }
                            );
                        }
                    } else {
                        showResultPopup(
                            false,
                            'Recognition Failed',
                            {
                                summary: data.error || 'Unknown error',
                                findings: [],
                                tip: 'Check your backend and try again.',
                                type: 'failure',
                                features: []
                            }
                        );
                    }
                } catch (err) {
                    showResultPopup(
                        false,
                        'Recognition Error',
                        {
                            summary: err.message,
                            findings: [],
                            tip: 'Is your backend running?',
                            type: 'failure',
                            features: []
                        }
                    );
                }
            } else {
                // Simulation (original logic)
                authData.attempts++;
                updateMetrics();
                updateStatus('faceStatus', 'Analyzing facial features...', 'processing');
                document.getElementById('faceBtn').disabled = true;
                setTimeout(() => {
                    showFaceDetection();
                }, 1000);
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 15;
                    document.getElementById('faceProgress').style.width = progress + '%';
                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        const success = Math.random() > 0.2;
                        if (success) {
                            authData.face = true;
                            updateStatus('faceStatus', 'Face authentication successful', 'success');
                            document.getElementById('faceData').innerHTML = generateBiometricData('face');
                            logActivity('Face authentication successful', 'success');
                            showResultPopup(true, 'Face authentication successful');
                        } else {
                            authData.failures++;
                            updateStatus('faceStatus', 'Face authentication failed', 'error');
                            logActivity('Face authentication failed', 'error');
                            showResultPopup(false, 'Face authentication failed');
                        }
                        document.getElementById('faceBtn').disabled = false;
                        checkMFAReadiness();
                        updateMetrics();
                    }
                }, 200);
            }
        }

        // Show face detection overlay
        function showFaceDetection() {
            const overlay = document.getElementById('faceOverlay');
            const box = document.createElement('div');
            box.className = 'face-detection-box';
            box.style.left = '25%';
            box.style.top = '20%';
            box.style.width = '50%';
            box.style.height = '60%';
            overlay.appendChild(box);
            
            setTimeout(() => {
                overlay.removeChild(box);
            }, 3000);
        }

        // Voice authentication simulation
        async function startVoiceAuth() {
            authData.attempts++;
            updateMetrics();
            
            updateStatus('voiceStatus', 'Listening for voice pattern...', 'processing');
            document.getElementById('voiceBtn').disabled = true;
            
            // Start voice visualization
            const visualizerInterval = setInterval(() => {
                updateVoiceVisualizer();
            }, 100);
            
            // Simulate authentication process
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 12;
                document.getElementById('voiceProgress').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    clearInterval(visualizerInterval);
                    
                    const success = Math.random() > 0.25; // 75% success rate
                    
                    if (success) {
                        authData.voice = true;
                        updateStatus('voiceStatus', 'Voice authentication successful', 'success');
                        document.getElementById('voiceData').innerHTML = generateBiometricData('voice');
                        logActivity('Voice authentication successful', 'success');
                        showResultPopup(true, 'Voice authentication successful');
                    } else {
                        authData.failures++;
                        updateStatus('voiceStatus', 'Voice authentication failed', 'error');
                        logActivity('Voice authentication failed', 'error');
                        showResultPopup(false, 'Voice authentication failed');
                    }
                    
                    document.getElementById('voiceBtn').disabled = false;
                    checkMFAReadiness();
                    updateMetrics();
                }
            }, 250);
        }

        // Fingerprint authentication simulation
        async function startFingerprintAuth() {
            authData.attempts++;
            updateMetrics();
            
            updateStatus('fingerprintStatus', 'Scanning fingerprint...', 'processing');
            document.getElementById('fingerprintScanner').style.pointerEvents = 'none';
            
            // Simulate authentication process
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 20;
                document.getElementById('fingerprintProgress').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    const success = Math.random() > 0.15; // 85% success rate
                    
                    if (success) {
                        authData.fingerprint = true;
                        updateStatus('fingerprintStatus', 'Fingerprint authentication successful', 'success');
                        document.getElementById('fingerprintData').innerHTML = generateBiometricData('fingerprint');
                        logActivity('Fingerprint authentication successful', 'success');
                        showResultPopup(true, 'Fingerprint authentication successful');
                    } else {
                        authData.failures++;
                        updateStatus('fingerprintStatus', 'Fingerprint authentication failed', 'error');
                        logActivity('Fingerprint authentication failed', 'error');
                        showResultPopup(false, 'Fingerprint authentication failed');
                    }
                    
                    document.getElementById('fingerprintScanner').style.pointerEvents = 'auto';
                    checkMFAReadiness();
                    updateMetrics();
                }
            }, 150);
        }

        // Multi-Factor Authentication
        async function startMFAAuth() {
            authData.attempts++;
            updateMetrics();
            
            updateStatus('mfaStatus', 'Verifying multi-factor authentication...', 'processing');
            document.getElementById('mfaBtn').disabled = true;
            
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 10;
                document.getElementById('mfaProgress').style.width = progress + '%';
                
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    const success = authData.face && authData.voice && authData.fingerprint;
                    
                    if (success) {
                        updateStatus('mfaStatus', '✅ Multi-Factor Authentication SUCCESSFUL', 'success');
                        document.getElementById('mfaData').innerHTML = generateBiometricData('mfa');
                        logActivity('Multi-Factor Authentication successful - ACCESS GRANTED', 'success');
                        showResultPopup(true, 'Multi-Factor Authentication successful - ACCESS GRANTED');
                    } else {
                        authData.failures++;
                        updateStatus('mfaStatus', '❌ Multi-Factor Authentication FAILED', 'error');
                        logActivity('Multi-Factor Authentication failed - ACCESS DENIED', 'error');
                        showResultPopup(false, 'Multi-Factor Authentication failed - ACCESS DENIED');
                    }
                    
                    document.getElementById('mfaBtn').disabled = false;
                    updateMetrics();
                }
            }, 300);
        }

        // Check if MFA is ready
        function checkMFAReadiness() {
            const mfaBtn = document.getElementById('mfaBtn');
            const readyCount = (authData.face ? 1 : 0) + (authData.voice ? 1 : 0) + (authData.fingerprint ? 1 : 0);
            
            if (readyCount >= 2) {
                mfaBtn.disabled = false;
                updateStatus('mfaStatus', `Ready for MFA (${readyCount}/3 factors authenticated)`, 'waiting');
            }
        }

        // Generate realistic biometric data
        function generateBiometricData(type) {
            const timestamp = new Date().toISOString();
            const randomHash = Math.random().toString(36).substring(2, 15);
            
            switch (type) {
                case 'face':
                    return `
                        <strong>Facial Recognition Data:</strong><br>
                        Timestamp: ${timestamp}<br>
                        Face ID: FACE_${randomHash.toUpperCase()}<br>
                        Confidence: ${(85 + Math.random() * 15).toFixed(2)}%<br>
                        Landmarks: 68 points detected<br>
                        Liveness: VERIFIED<br>
                        Encoding: ${randomHash}...
                    `;
                case 'voice':
                    return `
                        <strong>Voice Recognition Data:</strong><br>
                        Timestamp: ${timestamp}<br>
                        Voice ID: VOICE_${randomHash.toUpperCase()}<br>
                        Confidence: ${(80 + Math.random() * 20).toFixed(2)}%<br>
                        Frequency: ${(200 + Math.random() * 200).toFixed(0)}Hz<br>
                        Pattern Match: VERIFIED<br>
                        Encoding: ${randomHash}...
                    `;
                case 'fingerprint':
                    return `
                        <strong>Fingerprint Data:</strong><br>
                        Timestamp: ${timestamp}<br>
                        Print ID: PRINT_${randomHash.toUpperCase()}<br>
                        Confidence: ${(88 + Math.random() * 12).toFixed(2)}%<br>
                        Minutiae: ${Math.floor(25 + Math.random() * 15)} points<br>
                        Quality: HIGH<br>
                        Encoding: ${randomHash}...
                    `;
                case 'mfa':
                    return `
                        <strong>Multi-Factor Authentication:</strong><br>
                        Timestamp: ${timestamp}<br>
                        Session ID: MFA_${randomHash.toUpperCase()}<br>
                        Factors: Face + Voice + Fingerprint<br>
                        Overall Confidence: ${(92 + Math.random() * 8).toFixed(2)}%<br>
                        Security Level: MAXIMUM<br>
                        Status: ACCESS GRANTED
                    `;
            }
        }

        // Update status displays
        function updateStatus(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.className = `status-indicator status-${type}`;
            
            const icons = {
                waiting: '🟡',
                processing: '🔄',
                success: '✅',
                error: '❌'
            };
            
            element.innerHTML = `<span>${icons[type]} ${message}</span>`;
        }

        // Log activity
        function logActivity(message, type) {
            const logEntries = document.getElementById('logEntries');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            
            const timestamp = new Date().toLocaleTimeString();
            entry.innerHTML = `
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-message">${message}</span>
                <span class="log-status log-${type}">${type.toUpperCase()}</span>
            `;
            
            logEntries.insertBefore(entry, logEntries.firstChild);
            
            // Keep only last 20 entries
            while (logEntries.children.length > 20) {
                logEntries.removeChild(logEntries.lastChild);
            }
        }

        // Update metrics
        function updateMetrics() {
            // Calculate success rate
            const total = authData.attempts + authData.attackAttempts + authData.scanAttempts;
            const failed = authData.failures + authData.attackBreaches + authData.threats;
            const successRate = total > 0 ? ((total - failed) / total * 100).toFixed(1) : 0;
            document.getElementById('successRate').textContent = successRate + '%';
            document.getElementById('totalAttempts').textContent = total;
            document.getElementById('failedAttempts').textContent = failed;
            // Security Score: 100 - (failures*10) - (threats*7) - (vulnerabilities*12) - (attackBreaches*15)
            let score = 100 - (authData.failures * 10) - (authData.threats * 7) - (authData.vulnerabilities * 12) - (authData.attackBreaches * 15);
            // Bonus for all features ON
            const allFeaturesOn = [
                document.getElementById('toggleLiveness').checked,
                document.getElementById('toggleRateLimit').checked,
                document.getElementById('toggleAwareness').checked,
                document.getElementById('toggleAntiReplay').checked
            ].every(Boolean);
            if (allFeaturesOn) score += 10;
            score = Math.max(0, Math.min(100, score));
            animateMetric('securityScore', score);
            // Threat Level
            let threatLevel = 'LOW';
            if (authData.threats > 2 || authData.attackBreaches > 1 || authData.vulnerabilities > 2) threatLevel = 'HIGH';
            else if (authData.threats > 0 || authData.attackBreaches > 0 || authData.vulnerabilities > 0) threatLevel = 'MEDIUM';
            document.getElementById('threatLevel').textContent = threatLevel;
            // Vulnerabilities
            document.getElementById('vulnerabilities').textContent = authData.vulnerabilities;
        }
        // Animate metric changes
        function animateMetric(id, newValue) {
            const el = document.getElementById(id);
            const oldValue = parseInt(el.textContent) || 0;
            if (oldValue === newValue) return;
            let start = oldValue, end = newValue, duration = 500, startTime = null;
            function animateStep(ts) {
                if (!startTime) startTime = ts;
                const progress = Math.min((ts - startTime) / duration, 1);
                const val = Math.round(start + (end - start) * progress);
                el.textContent = val;
                if (progress < 1) requestAnimationFrame(animateStep);
                else el.textContent = end;
            }
            requestAnimationFrame(animateStep);
        }
        // Track attack and scan attempts/breaches
        if (!authData.attackAttempts) authData.attackAttempts = 0;
        if (!authData.attackBreaches) authData.attackBreaches = 0;
        if (!authData.scanAttempts) authData.scanAttempts = 0;
        // Patch attack/scan functions to update metrics
        const oldSimulateSpoofingAttack = simulateSpoofingAttack;
        simulateSpoofingAttack = async function() {
            authData.attackAttempts++;
            await oldSimulateSpoofingAttack.apply(this, arguments);
            updateMetrics();
        };
        const oldSimulateBruteForce = simulateBruteForce;
        simulateBruteForce = async function() {
            authData.attackAttempts++;
            await oldSimulateBruteForce.apply(this, arguments);
            updateMetrics();
        };
        const oldSimulateSocialEngineering = simulateSocialEngineering;
        simulateSocialEngineering = async function() {
            authData.attackAttempts++;
            await oldSimulateSocialEngineering.apply(this, arguments);
            updateMetrics();
        };
        const oldSimulateReplayAttack = simulateReplayAttack;
        simulateReplayAttack = async function() {
            authData.attackAttempts++;
            await oldSimulateReplayAttack.apply(this, arguments);
            updateMetrics();
        };
        const oldStartPenetrationTest = startPenetrationTest;
        startPenetrationTest = async function() {
            authData.scanAttempts++;
            await oldStartPenetrationTest.apply(this, arguments);
            updateMetrics();
        };
        const oldStartThreatDetection = startThreatDetection;
        startThreatDetection = async function() {
            authData.scanAttempts++;
            await oldStartThreatDetection.apply(this, arguments);
            updateMetrics();
        };
        const oldStartNetworkMonitor = startNetworkMonitor;
        startNetworkMonitor = async function() {
            authData.scanAttempts++;
            await oldStartNetworkMonitor.apply(this, arguments);
            updateMetrics();
        };
        const oldStartEncryptionAnalysis = startEncryptionAnalysis;
        startEncryptionAnalysis = async function() {
            authData.scanAttempts++;
            await oldStartEncryptionAnalysis.apply(this, arguments);
            updateMetrics();
        };
        // Track breaches in attack result popups
        const oldShowResultPopup = showResultPopup;
        showResultPopup = function(success, message, options = {}) {
            // If this is an attack and it failed (breached), increment attackBreaches
            if (options && options.type === 'failure') {
                authData.attackBreaches = (authData.attackBreaches || 0) + 1;
            }
            oldShowResultPopup.apply(this, arguments);
            updateMetrics();
        };
        // Update metrics when toggles change
        ['toggleLiveness','toggleRateLimit','toggleAwareness','toggleAntiReplay'].forEach(id => {
            document.getElementById(id).addEventListener('change', updateMetrics);
        });
        // ... existing code ...
        // Call updateMetrics on page load
        window.addEventListener('load', () => {
            updateMetrics();
        });
        // ... existing code ...

        // Cybersecurity Functions
        
        // Penetration Testing
        async function startPenetrationTest() {
            const output = document.getElementById('penTestOutput');
            output.innerHTML = '';
            // Read toggles
            const livenessOn = document.getElementById('toggleLiveness').checked;
            const rateLimitOn = document.getElementById('toggleRateLimit').checked;
            const awarenessOn = document.getElementById('toggleAwareness').checked;
            const antiReplayOn = document.getElementById('toggleAntiReplay').checked;
            let vulnerabilities = [];
            let recommendations = [];
            if (!livenessOn) {
                vulnerabilities.push('Biometric spoofing vulnerability: Liveness Detection is OFF');
                recommendations.push('Enable Liveness Detection to prevent spoofing attacks.');
            }
            if (!rateLimitOn) {
                vulnerabilities.push('Brute force vulnerability: Rate Limiting is OFF');
                recommendations.push('Enable Rate Limiting to block brute force attacks.');
            }
            if (!awarenessOn) {
                vulnerabilities.push('Social engineering risk: Security Awareness Training is OFF');
                recommendations.push('Enable Security Awareness Training to reduce social engineering risk.');
            }
            if (!antiReplayOn) {
                vulnerabilities.push('Replay attack vulnerability: Anti-Replay Protection is OFF');
                recommendations.push('Enable Anti-Replay Protection to block replay attacks.');
            }
            const tests = [
                'Initializing penetration test framework...',
                'Scanning for open ports...',
                'Port 22 (SSH): CLOSED',
                'Port 80 (HTTP): OPEN',
                'Port 443 (HTTPS): OPEN',
                'Port 8080 (HTTP-ALT): FILTERED',
                'Testing authentication bypass...',
                'SQL injection test: SECURE',
                'Cross-site scripting test: SECURE',
                'Buffer overflow test: SECURE',
                'Privilege escalation test: SECURE',
                livenessOn ? 'Biometric spoofing test: SECURE' : 'Biometric spoofing test: VULNERABLE',
                'Session hijacking test: SECURE',
                'Man-in-the-middle test: SECURE',
                rateLimitOn ? 'Brute force test: SECURE' : 'Brute force test: VULNERABLE',
                awarenessOn ? 'Social engineering test: SECURE' : 'Social engineering test: VULNERABLE',
                antiReplayOn ? 'Replay attack test: SECURE' : 'Replay attack test: VULNERABLE',
                'Generating vulnerability report...',
                '═══════════════════════════',
                'PENETRATION TEST COMPLETE',
                '═══════════════════════════',
                `Vulnerabilities found: ${vulnerabilities.length}`,
                `Risk level: ${vulnerabilities.length === 0 ? 'LOW' : vulnerabilities.length <= 2 ? 'MEDIUM' : 'HIGH'}`
            ];
            if (vulnerabilities.length > 0) {
                tests.push('Vulnerabilities:');
                vulnerabilities.forEach(v => tests.push('• ' + v));
                tests.push('Recommendations:');
                recommendations.forEach(r => tests.push('• ' + r));
            } else {
                tests.push('No critical vulnerabilities detected.');
            }
            for (let i = 0; i < tests.length; i++) {
                await new Promise(r => setTimeout(r, 200));
                    output.innerHTML += tests[i] + '\n';
                    output.scrollTop = output.scrollHeight;
            }
            authData.vulnerabilities = vulnerabilities.length;
                updateMetrics();
            showResultPopup(
                vulnerabilities.length === 0,
                `Penetration Test: ${vulnerabilities.length === 0 ? 'No Critical Vulnerabilities' : 'Vulnerabilities Found!'}`,
                {
                    summary: `${vulnerabilities.length} vulnerability(ies) found. Risk: ${vulnerabilities.length === 0 ? 'LOW' : vulnerabilities.length <= 2 ? 'MEDIUM' : 'HIGH'}`,
                    findings: vulnerabilities.length > 0 ? vulnerabilities : ['All critical security features are enabled.'],
                    tip: vulnerabilities.length === 0 ? 'Your system is well protected. Keep security features ON!' : 'Enable all security features for best protection.',
                    type: vulnerabilities.length === 0 ? 'success' : 'warning',
                    features: [
                        { name: 'Liveness Detection', on: livenessOn },
                        { name: 'Rate Limiting', on: rateLimitOn },
                        { name: 'Awareness Training', on: awarenessOn },
                        { name: 'Anti-Replay', on: antiReplayOn }
                    ]
                }
            );
            logActivity(`Penetration test completed - ${vulnerabilities.length} vulnerability(ies) found`, vulnerabilities.length > 0 ? 'warning' : 'success');
        }

        // Threat Detection
        async function startThreatDetection() {
            const output = document.getElementById('threatOutput');
            output.innerHTML = '';
            // Read toggles
            const livenessOn = document.getElementById('toggleLiveness').checked;
            const rateLimitOn = document.getElementById('toggleRateLimit').checked;
            const awarenessOn = document.getElementById('toggleAwareness').checked;
            const antiReplayOn = document.getElementById('toggleAntiReplay').checked;
            let threats = [];
            if (!rateLimitOn) threats.push('Brute force attack detected (Rate Limiting OFF)');
            if (!livenessOn) threats.push('Biometric spoofing detected (Liveness Detection OFF)');
            if (!awarenessOn) threats.push('Social engineering attempt detected (Awareness Training OFF)');
            if (!antiReplayOn) threats.push('Replay attack detected (Anti-Replay OFF)');
            const baseThreats = [
                'Initializing threat detection system...',
                'Loading threat intelligence database...',
                'Scanning system for malicious activities...',
                'Checking for unauthorized access attempts...',
                'Analyzing network traffic patterns...',
                'Detecting suspicious IP addresses...'
            ];
            threats.forEach(t => baseThreats.push('⚠️ THREAT DETECTED: ' + t));
            baseThreats.push('Updating threat database...');
            baseThreats.push('Implementing countermeasures...');
            baseThreats.push('═══════════════════════════');
            baseThreats.push('THREAT SCAN COMPLETE');
            baseThreats.push('═══════════════════════════');
            baseThreats.push(`Threats detected: ${threats.length}`);
            baseThreats.push(`System status: ${threats.length > 0 ? 'UNDER ATTACK' : 'SECURE'}`);
            if (threats.length > 0) {
                baseThreats.push('Recommended action: IMMEDIATE RESPONSE');
            } else {
                baseThreats.push('No active threats detected.');
            }
            for (let i = 0; i < baseThreats.length; i++) {
                await new Promise(r => setTimeout(r, 150));
                output.innerHTML += baseThreats[i] + '\n';
                    output.scrollTop = output.scrollHeight;
            }
            authData.threats = threats.length;
            cyberData.threatLevel = threats.length > 0 ? 'HIGH' : 'LOW';
                updateMetrics();
            showResultPopup(
                threats.length === 0,
                `Threat Detection: ${threats.length === 0 ? 'No Active Threats' : 'Threats Detected!'}`,
                {
                    summary: `${threats.length} threat(s) detected.`,
                    findings: threats.length > 0 ? threats : ['No suspicious activity found.'],
                    tip: threats.length === 0 ? 'System is safe. Stay vigilant!' : 'Respond to threats and enable all security features.',
                    type: threats.length === 0 ? 'success' : 'warning',
                    features: [
                        { name: 'Liveness Detection', on: livenessOn },
                        { name: 'Rate Limiting', on: rateLimitOn },
                        { name: 'Awareness Training', on: awarenessOn },
                        { name: 'Anti-Replay', on: antiReplayOn }
                    ]
                }
            );
            logActivity(`Threat detection completed - ${threats.length} threat(s) identified`, threats.length > 0 ? 'error' : 'success');
        }

        // Network Monitor
        async function startNetworkMonitor() {
            const output = document.getElementById('networkOutput');
            output.innerHTML = '';
            // Read toggles
            const rateLimitOn = document.getElementById('toggleRateLimit').checked;
            let networkFindings = [
                'Starting network monitoring...',
                'Capturing network packets...',
                'Analyzing traffic patterns...',
                '═══════════════════════════',
                'NETWORK TRAFFIC ANALYSIS',
                '═══════════════════════════',
                'Active connections: 47',
                'Suspicious connections: 3',
                'Bandwidth usage: 156.3 MB/s',
                'Packets captured: 15,647',
                'Malformed packets: 23',
                'DDoS indicators: DETECTED',
                'Firewall rules: 156 active',
                'Intrusion attempts: 12',
                'Geolocation analysis:',
                '• China: 34% of traffic',
                '• Russia: 28% of traffic',
                '• USA: 23% of traffic',
                '• Unknown: 15% of traffic',
                'Protocol analysis:',
                '• HTTP: 45%',
                '• HTTPS: 35%',
                '• SSH: 12%',
                '• Unknown: 8%'
            ];
            if (!rateLimitOn) {
                networkFindings.push('⚠️ No rate limiting detected: Brute force attempts possible.');
            }
            networkFindings.push('⚠️ Anomalous traffic detected');
            networkFindings.push('Recommendation: Block suspicious IPs');
            for (let i = 0; i < networkFindings.length; i++) {
                await new Promise(r => setTimeout(r, 100));
                output.innerHTML += networkFindings[i] + '\n';
                    output.scrollTop = output.scrollHeight;
            }
            showResultPopup(
                rateLimitOn,
                rateLimitOn ? 'Network Monitoring: Rate Limiting Active' : 'Network Monitoring: No Rate Limiting!',
                {
                    summary: rateLimitOn ? 'Network is protected against brute force.' : 'Brute force attempts possible! Enable Rate Limiting.',
                    findings: rateLimitOn ? ['No brute force risk detected.'] : ['No rate limiting detected: Brute force attempts possible.'],
                    tip: rateLimitOn ? 'Good job! Rate Limiting is ON.' : 'Turn ON Rate Limiting to block brute force attacks.',
                    type: rateLimitOn ? 'success' : 'warning',
                    features: [
                        { name: 'Rate Limiting', on: rateLimitOn }
                    ]
                }
            );
                logActivity('Network monitoring completed - anomalous traffic detected', 'warning');
        }

        // Encryption Analysis
        async function startEncryptionAnalysis() {
            const output = document.getElementById('encryptionOutput');
            output.innerHTML = '';
            // Read toggles
            const antiReplayOn = document.getElementById('toggleAntiReplay').checked;
            let encryptionData = [
                'Initializing encryption analysis...',
                'Scanning cryptographic implementations...',
                'Analyzing key management systems...',
                '═══════════════════════════',
                'ENCRYPTION ANALYSIS REPORT',
                '═══════════════════════════',
                'Biometric data encryption: AES-256',
                'Key strength: 256-bit ✓',
                'Certificate validity: VALID',
                'TLS version: 1.3 ✓',
                'Cipher suite: TLS_AES_256_GCM_SHA384',
                'Perfect Forward Secrecy: ENABLED',
                'HSTS enabled: YES',
                'Certificate pinning: ACTIVE',
                'Key rotation: AUTOMATED',
                'Quantum resistance: PARTIAL',
                'Hash function: SHA-256',
                'Salt generation: CRYPTOGRAPHICALLY SECURE',
                'Session encryption: ChaCha20-Poly1305'
            ];
            if (!antiReplayOn) {
                encryptionData.push('⚠️ Anti-Replay Protection: DISABLED (Replay attacks possible!)');
            } else {
                encryptionData.push('Anti-Replay Protection: ENABLED');
            }
            encryptionData.push('Vulnerability assessment:');
            if (!antiReplayOn) {
                encryptionData.push('• Replay attack risk: HIGH');
            } else {
                encryptionData.push('• Replay attack risk: LOW');
            }
            encryptionData.push('• Weak ciphers: NONE FOUND');
            encryptionData.push('• Expired certificates: NONE');
            encryptionData.push('• Weak keys: NONE FOUND');
            encryptionData.push('• Deprecated protocols: NONE');
            encryptionData.push('Overall security rating: ' + (antiReplayOn ? 'A+' : 'B'));
            encryptionData.push('Recommendations: ' + (antiReplayOn ? 'Consider post-quantum cryptography' : 'Enable Anti-Replay Protection'));
            for (let i = 0; i < encryptionData.length; i++) {
                await new Promise(r => setTimeout(r, 120));
                    output.innerHTML += encryptionData[i] + '\n';
                    output.scrollTop = output.scrollHeight;
            }
            showResultPopup(
                antiReplayOn,
                antiReplayOn ? 'Encryption Analysis: Anti-Replay Enabled' : 'Encryption Analysis: Anti-Replay OFF!',
                {
                    summary: antiReplayOn ? 'Replay attack risk: LOW' : 'Replay attack risk: HIGH',
                    findings: [antiReplayOn ? 'Anti-Replay Protection is ENABLED.' : 'Anti-Replay Protection is DISABLED. Replay attacks possible!'],
                    tip: antiReplayOn ? 'Excellent! Anti-Replay is ON.' : 'Turn ON Anti-Replay to block replay attacks.',
                    type: antiReplayOn ? 'success' : 'warning',
                    features: [
                        { name: 'Anti-Replay', on: antiReplayOn }
                    ]
                }
            );
            logActivity('Encryption analysis completed - security rating ' + (antiReplayOn ? 'A+' : 'B'), antiReplayOn ? 'success' : 'warning');
        }

        // Attack Simulations

        // Spoofing Attack
        async function simulateSpoofingAttack() {
            const result = document.getElementById('spoofingResult');
            result.innerHTML = '';
            const livenessOn = document.getElementById('toggleLiveness').checked;
            const spoofingSteps = [
                '🎭 Launching biometric spoofing attack...',
                '📸 Capturing high-resolution facial images...',
                '🖼️ Creating 3D face model...',
                '🎨 Generating synthetic facial features...',
                '📱 Attempting to bypass liveness detection...'
            ];
            if (!livenessOn) {
                spoofingSteps.push('⚠️ Liveness check: BYPASSED', '❌ Attack NOT detected by anti-spoofing system', '🎭 Spoofing attack SUCCESSFUL!', 'System status: BREACHED');
            } else {
                spoofingSteps.push('⚠️ Liveness check: FAILED', '❌ Attack detected by anti-spoofing system', '🎭 Spoofing attack BLOCKED!', 'System status: SECURE');
            }
            for (let i = 0; i < spoofingSteps.length; i++) {
                await new Promise(r => setTimeout(r, 200));
                    result.innerHTML += spoofingSteps[i] + '\n';
                    result.scrollTop = result.scrollHeight;
            }
            if (!livenessOn) {
                logActivity('Spoofing attack simulation completed - attack successful', 'error');
                showResultPopup(false, 'Spoofing Attack: System Breached!', {
                    summary: 'Spoofing attack succeeded. Liveness Detection is OFF.',
                    findings: ['Liveness Detection is OFF: System is vulnerable to spoofing.'],
                    tip: 'Turn ON Liveness Detection to block spoofing attacks.',
                    type: 'failure',
                    features: [
                        { name: 'Liveness Detection', on: livenessOn }
                    ]
                });
            } else {
                logActivity('Spoofing attack simulation completed - attack blocked', 'success');
                showResultPopup(true, 'Spoofing Attack: Blocked!', {
                    summary: 'Spoofing attack blocked. Liveness Detection is ON.',
                    findings: ['Liveness Detection is ON: System protected from spoofing.'],
                    tip: 'Keep Liveness Detection ON for best protection.',
                    type: 'success',
                    features: [
                        { name: 'Liveness Detection', on: livenessOn }
                    ]
                });
            }
        }

        // Brute Force Attack
        async function simulateBruteForce() {
            const result = document.getElementById('bruteForceResult');
            result.innerHTML = '';
            const rateLimitOn = document.getElementById('toggleRateLimit').checked;
            const bruteForceSteps = [
                '🌊 Initiating brute force attack...',
                '🔢 Generating authentication combinations...',
                '🎯 Target: Multi-factor authentication system',
                '⚡ Attack rate: 1000 attempts/second',
                '🔐 Attempting combinations...'
            ];
            if (!rateLimitOn) {
                bruteForceSteps.push('❌ No rate limiting: Attack continues', '🚨 ALERT: Account NOT locked', '🌊 Brute force attack SUCCESSFUL!', 'System status: BREACHED');
            } else {
                bruteForceSteps.push('❌ Attempt 1-100: FAILED', '🚨 ALERT: Rate limiting activated', '🔒 Account lockout triggered', '🛡️ IP address blocked', '🌊 Brute force attack BLOCKED!', 'System status: SECURE');
            }
            for (let i = 0; i < bruteForceSteps.length; i++) {
                await new Promise(r => setTimeout(r, 150));
                    result.innerHTML += bruteForceSteps[i] + '\n';
                    result.scrollTop = result.scrollHeight;
            }
            if (!rateLimitOn) {
                logActivity('Brute force attack simulation completed - attack successful', 'error');
                showResultPopup(false, 'Brute Force: System Breached!', {
                    summary: 'Brute force attack succeeded. Rate Limiting is OFF.',
                    findings: ['Rate Limiting is OFF: System is vulnerable to brute force.'],
                    tip: 'Turn ON Rate Limiting to block brute force attacks.',
                    type: 'failure',
                    features: [
                        { name: 'Rate Limiting', on: rateLimitOn }
                    ]
                });
            } else {
                logActivity('Brute force attack simulation completed - attack repelled', 'success');
                showResultPopup(true, 'Brute Force: Blocked!', {
                    summary: 'Brute force attack blocked. Rate Limiting is ON.',
                    findings: ['Rate Limiting is ON: System protected from brute force.'],
                    tip: 'Keep Rate Limiting ON for best protection.',
                    type: 'success',
                    features: [
                        { name: 'Rate Limiting', on: rateLimitOn }
                    ]
                });
            }
        }

        // Social Engineering Attack
        async function simulateSocialEngineering() {
            const result = document.getElementById('socialEngResult');
            result.innerHTML = '';
            const awarenessOn = document.getElementById('toggleAwareness').checked;
            const socialEngSteps = [
                '🕷️ Launching social engineering attack...',
                '📧 Crafting phishing emails...',
                '🎭 Creating fake admin persona...',
                '📞 Attempting phone-based attack...',
                '🎯 Target: System administrator'
            ];
            if (!awarenessOn) {
                socialEngSteps.push('🤔 Target response: Credentials provided', '🕷️ Social engineering attack SUCCESSFUL!', 'System status: BREACHED');
            } else {
                socialEngSteps.push('🤔 Target response: "I need to verify your identity"', '🚨 ALERT: Email flagged by security system', '🛡️ Security awareness training triggered', '🕷️ Social engineering attack BLOCKED!', 'System status: SECURE');
            }
            for (let i = 0; i < socialEngSteps.length; i++) {
                await new Promise(r => setTimeout(r, 180));
                    result.innerHTML += socialEngSteps[i] + '\n';
                    result.scrollTop = result.scrollHeight;
            }
            if (!awarenessOn) {
                logActivity('Social engineering attack simulation completed - attack successful', 'error');
                showResultPopup(false, 'Social Engineering: System Breached!', {
                    summary: 'Social engineering attack succeeded. Awareness Training is OFF.',
                    findings: ['Awareness Training is OFF: Users are vulnerable to social engineering.'],
                    tip: 'Turn ON Security Awareness Training to reduce social engineering risk.',
                    type: 'failure',
                    features: [
                        { name: 'Awareness Training', on: awarenessOn }
                    ]
                });
            } else {
                logActivity('Social engineering attack simulation completed - employees vigilant', 'success');
                showResultPopup(true, 'Social Engineering: Blocked!', {
                    summary: 'Social engineering attack blocked. Awareness Training is ON.',
                    findings: ['Awareness Training is ON: Users are vigilant.'],
                    tip: 'Keep Awareness Training ON for best protection.',
                    type: 'success',
                    features: [
                        { name: 'Awareness Training', on: awarenessOn }
                    ]
                });
            }
        }

        // Replay Attack
        async function simulateReplayAttack() {
            const result = document.getElementById('replayResult');
            result.innerHTML = '';
            const antiReplayOn = document.getElementById('toggleAntiReplay').checked;
            const replaySteps = [
                '🔁 Initiating replay attack...',
                '📡 Intercepting biometric authentication data...',
                '📊 Capturing authentication session...',
                '🎯 Target: Biometric hash values',
                '📝 Recording authentication sequence...'
            ];
            if (!antiReplayOn) {
                replaySteps.push('🔄 Attempting to replay captured session...', '⚠️ No anti-replay: Attack successful', '🔁 Replay attack SUCCESSFUL!', 'System status: BREACHED');
            } else {
                replaySteps.push('🔄 Attempting to replay captured session...', '⚠️ Timestamp validation: FAILED', '🚨 ALERT: Replay attack detected', '🔒 Session invalidated', '🔁 Replay attack BLOCKED!', 'System status: SECURE');
            }
            for (let i = 0; i < replaySteps.length; i++) {
                await new Promise(r => setTimeout(r, 160));
                    result.innerHTML += replaySteps[i] + '\n';
                    result.scrollTop = result.scrollHeight;
            }
            if (!antiReplayOn) {
                logActivity('Replay attack simulation completed - attack successful', 'error');
                showResultPopup(false, 'Replay Attack: System Breached!', {
                    summary: 'Replay attack succeeded. Anti-Replay is OFF.',
                    findings: ['Anti-Replay is OFF: System is vulnerable to replay attacks.'],
                    tip: 'Turn ON Anti-Replay to block replay attacks.',
                    type: 'failure',
                    features: [
                        { name: 'Anti-Replay', on: antiReplayOn }
                    ]
                });
            } else {
                logActivity('Replay attack simulation completed - anti-replay measures effective', 'success');
                showResultPopup(true, 'Replay Attack: Blocked!', {
                    summary: 'Replay attack blocked. Anti-Replay is ON.',
                    findings: ['Anti-Replay is ON: System protected from replay attacks.'],
                    tip: 'Keep Anti-Replay ON for best protection.',
                    type: 'success',
                    features: [
                        { name: 'Anti-Replay', on: antiReplayOn }
                    ]
                });
            }
        }

        // Initialize system when page loads
        window.addEventListener('load', initializeSystem);

        // Modal logic
        function showModal(html) {
            document.getElementById('modalBody').innerHTML = html;
            document.getElementById('customModal').classList.add('active');
        }
        function closeModal() {
            document.getElementById('customModal').classList.remove('active');
        }
        // Explanations and defenses for each attack/scan
        const explanations = {
            spoofing: {
                title: 'Spoofing Attack',
                steps: [
                    'Attacker collects biometric data (e.g., photos, fingerprints).',
                    'Creates fake biometric artifacts (3D models, printed photos, etc.).',
                    'Attempts to fool the biometric system into granting access.'
                ],
                defense: [
                    'Implement liveness detection (detects real vs. fake biometrics).',
                    'Use multi-factor authentication.',
                    'Regularly update anti-spoofing algorithms.'
                ]
            },
            brute: {
                title: 'Brute Force Attack',
                steps: [
                    'Attacker tries many authentication combinations rapidly.',
                    'Attempts to guess passwords, PINs, or biometric patterns.',
                    'May use botnets to distribute attack.'
                ],
                defense: [
                    'Enforce rate limiting and account lockout policies.',
                    'Monitor for unusual login attempts.',
                    'Use strong, unique credentials and MFA.'
                ]
            },
            social: {
                title: 'Social Engineering',
                steps: [
                    'Attacker manipulates people to reveal confidential info.',
                    'Uses phishing emails, fake calls, or impersonation.',
                    'Tricks users into giving up credentials or access.'
                ],
                defense: [
                    'Conduct regular security awareness training.',
                    'Verify identities before sharing sensitive info.',
                    'Report suspicious communications.'
                ]
            },
            replay: {
                title: 'Replay Attack',
                steps: [
                    'Attacker intercepts authentication data during transmission.',
                    'Replays captured data to try to gain unauthorized access.',
                    'Attempts to bypass session validation.'
                ],
                defense: [
                    'Use encrypted, time-stamped, and nonce-based sessions.',
                    'Implement challenge-response protocols.',
                    'Invalidate sessions after use.'
                ]
            },
            pentest: {
                title: 'Penetration Testing',
                steps: [
                    'Simulates real-world attacks to find vulnerabilities.',
                    'Scans for open ports, weak authentication, and exploits.',
                    'Reports findings for remediation.'
                ]
            },
            threat: {
                title: 'Threat Detection',
                steps: [
                    'Monitors system for suspicious activities.',
                    'Detects brute force, spoofing, phishing, and more.',
                    'Alerts admins to take action.'
                ]
            },
            network: {
                title: 'Network Monitor',
                steps: [
                    'Analyzes network traffic for anomalies.',
                    'Detects DDoS, suspicious connections, and intrusions.',
                    'Logs and reports findings.'
                ]
            },
            encryption: {
                title: 'Encryption Analysis',
                steps: [
                    'Checks cryptographic implementations and key management.',
                    'Assesses encryption strength and vulnerabilities.',
                    'Recommends improvements.'
                ]
            }
        };
        // Info button handler
        function showInfo(type) {
            const exp = explanations[type];
            let html = `<div class='modal-title'>${exp.title} - How it Works</div>`;
            html += `<div class='modal-section-title'>Steps:</div><ul class='modal-list'>`;
            exp.steps.forEach(step => html += `<li>${step}</li>`);
            html += `</ul>`;
            if (exp.defense) {
                html += `<div class='modal-section-title'>How to Defend:</div><ul class='modal-list'>`;
                exp.defense.forEach(def => html += `<li>${def}</li>`);
                html += '</ul>';
            }
            showModal(html);
        }
        // Popup for simulation results
        function showResultPopup(success, message, options = {}) {
            // options: { summary, findings, features, tip, type }
            let icon = success ? '✅' : (options.type === 'warning' ? '⚠️' : '❌');
            if (options.type === 'info') icon = 'ℹ️';
            let iconClass = 'animated-icon';
            let colorClass = success ? 'modal-success' : (options.type === 'warning' ? 'modal-warning' : 'modal-failure');
            let html = `<div class='${iconClass}'>${icon}</div>`;
            html += `<div class='modal-title'>${message}</div>`;
            if (options.summary) {
                html += `<div class='modal-summary'>${options.summary}</div>`;
            }
            if (options.findings && options.findings.length > 0) {
                html += `<div class='modal-section-title'>Key Findings:</div><ul class='modal-list'>`;
                options.findings.forEach(f => html += `<li>${f}</li>`);
                html += '</ul>';
            }
            if (options.features) {
                html += `<div class='modal-section-title'>Security Features:</div><div class='modal-features'>`;
                options.features.forEach(f => {
                    html += `<span class='${f.on ? '' : 'feature-off'}'>${f.name}${f.on ? ' ON' : ' OFF'}</span>`;
                });
                html += '</div>';
            }
            if (options.tip) {
                html += `<div class='modal-tip'>${options.tip}</div>`;
            }
            showModal(html);
        }

        // --- Real Face Registration & Recognition ---
        // Helper: Capture current webcam frame as base64 PNG
        function getWebcamBase64() {
            const video = document.getElementById('webcam');
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/png');
        }

        // Show the register face input and confirm button
        function showRegisterFaceInput() {
            document.getElementById('registerFaceForm').style.display = 'block';
            document.getElementById('showRegisterFace').style.display = 'none';
            document.getElementById('faceName').focus();
        }

        // Enhanced registerFace with progress bar and popup
        async function registerFace() {
            const name = document.getElementById('faceName').value.trim();
            if (!name) {
                showResultPopup(false, 'Please enter a name for registration.', { type: 'failure' });
                return;
            }
            // Show progress bar
            const progressBar = document.getElementById('registerFaceProgress');
            const progressFill = document.getElementById('registerFaceProgressFill');
            progressBar.style.display = 'block';
            progressFill.style.width = '0%';
            document.getElementById('confirmRegisterFace').disabled = true;
            document.getElementById('faceName').disabled = true;

            // Animate progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20 + 10;
                if (progress > 100) progress = 100;
                progressFill.style.width = progress + '%';
                if (progress >= 100) {
                    clearInterval(interval);
                    doRegisterFace(name);
                }
            }, 200);
        }

        // Actual registration logic (calls backend)
        async function doRegisterFace(name) {
            const image = getWebcamBase64();
            try {
                const res = await fetch('http://127.0.0.1:5000/register_face', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, image })
                });
                const data = await res.json();
                if (data.success) {
                    showResultPopup(true, 'Registration Successful', {
                        summary: `👤 <b>${name}</b> registered!`,
                        findings: [],
                        tip: 'You can now authenticate with your face.',
                        type: 'success',
                        features: []
                    });
                } else {
                    showResultPopup(false, 'Registration Failed', {
                        summary: data.error || 'Unknown error',
                        findings: [],
                        tip: 'Try again or check your backend.',
                        type: 'failure',
                        features: []
                    });
                }
            } catch (err) {
                showResultPopup(false, 'Registration Error', {
                    summary: err.message,
                    findings: [],
                    tip: 'Is your backend running?',
                    type: 'failure',
                    features: []
                });
            }
            // Reset form (no reload, just UI reset)
            document.getElementById('registerFaceForm').style.display = 'none';
            document.getElementById('showRegisterFace').style.display = 'inline-block';
            document.getElementById('faceName').value = '';
            document.getElementById('faceName').disabled = false;
            document.getElementById('confirmRegisterFace').disabled = false;
            document.getElementById('registerFaceProgress').style.display = 'none';
            document.getElementById('registerFaceProgressFill').style.width = '0%';
        }

        // Prevent form submission from reloading the page
        document.addEventListener('DOMContentLoaded', function() {
            const registerFaceForm = document.getElementById('registerFaceForm');
            if (registerFaceForm) {
                registerFaceForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    return false;
                });
            }
        });

        // Recognize a face
        async function recognizeFace() {
            const image = getWebcamBase64();
            showFaceRecognitionResult('Recognizing...', true);
            const res = await fetch('http://127.0.0.1:5000/recognize_face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image })
            });
            const data = await res.json();
            if (data.success) {
                if (data.name && data.name !== 'Unknown') {
                    showFaceRecognitionResult(
                        `👤 <b>${data.name}</b> recognized!<br>Confidence: ${data.confidence.toFixed(2)}`,
                        true
                    );
                } else {
                    showFaceRecognitionResult('Face not recognized.', false);
                }
            } else {
                showFaceRecognitionResult('❌ Recognition failed: ' + data.error, false);
            }
        }

        // Show result in the UI
        function showFaceRecognitionResult(msg, success) {
            const el = document.getElementById('faceRecognitionResult');
            el.innerHTML = msg;
            el.style.color = success ? '#28a745' : '#dc3545';
        }

        function openRegisterFaceModal() {
  const webcam = document.getElementById('webcam');
  const modalHtml = `
    <div class='modal-title'>Register Your Face</div>
    <div style='margin: 16px 0;'>
      <video id='modalWebcamPreview' autoplay muted style='width: 100%; border-radius: 12px; background: #222;'></video>
    </div>
    <div style='font-size: 0.98em; color: #764ba2; margin-bottom: 10px;'>Tip: Center your face, look at the camera, and ensure good lighting.</div>
    <input type='text' id='modalFaceName' placeholder='Enter your name' style='width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; font-size: 1.1em; margin-bottom: 16px;'>
    <button class='btn btn-confirm-register-face' id='modalConfirmRegisterFace' style='width: 100%; font-size: 1.1em; margin-bottom: 12px;'>📸 Confirm Registration</button>
    <div id='modalRegisterFaceProgress' style='height: 10px; background: #eee; border-radius: 5px; margin-bottom: 8px; display: none;'>
      <div id='modalRegisterFaceProgressFill' style='height: 100%; width: 0%; background: linear-gradient(90deg,#667eea,#764ba2); border-radius: 5px; transition: width 0.3s;'></div>
    </div>
    <div id='modalRegisterFaceError' style='color: #dc3545; font-weight: 500; min-height: 24px;'></div>
  `;
  showModal(modalHtml);

  // Use the main webcam stream for preview
  const modalWebcam = document.getElementById('modalWebcamPreview');
  if (webcam && webcam.srcObject) {
    modalWebcam.srcObject = webcam.srcObject;
  }

  document.getElementById('modalConfirmRegisterFace').onclick = async function() {
    const name = document.getElementById('modalFaceName').value.trim();
    const errorDiv = document.getElementById('modalRegisterFaceError');
    if (!name) {
      errorDiv.textContent = 'Please enter your name.';
      return;
    }
    errorDiv.textContent = '';
    this.disabled = true;
    document.getElementById('modalFaceName').disabled = true;
    const progressBar = document.getElementById('modalRegisterFaceProgress');
    const progressFill = document.getElementById('modalRegisterFaceProgressFill');
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    // Animate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20 + 10;
      if (progress > 100) progress = 100;
      progressFill.style.width = progress + '%';
      if (progress >= 100) {
        clearInterval(interval);
        doRegisterFaceModal(name, modalWebcam);
      }
    }, 200);
  };
}

async function doRegisterFaceModal(name, modalWebcam) {
  // Capture image from modal webcam (main webcam stream)
  let image;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = modalWebcam.videoWidth || 640;
    canvas.height = modalWebcam.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(modalWebcam, 0, 0, canvas.width, canvas.height);
    image = canvas.toDataURL('image/png');
  } catch (e) {
    document.getElementById('modalRegisterFaceError').textContent = 'Could not capture webcam image.';
    return;
  }
  try {
    const res = await fetch('http://127.0.0.1:5000/register_face', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, image })
    });
    const data = await res.json();
    if (data.success) {
      closeModal();
      showResultPopup(true, 'Registration Successful', {
        summary: `👤 <b>${name}</b> registered!`,
        findings: [],
        tip: 'You can now authenticate with your face.',
        type: 'success',
        features: []
      });
    } else {
      document.getElementById('modalRegisterFaceError').textContent = data.error || 'Unknown error.';
      document.getElementById('modalConfirmRegisterFace').disabled = false;
      document.getElementById('modalFaceName').disabled = false;
    }
  } catch (err) {
    document.getElementById('modalRegisterFaceError').textContent = err.message;
    document.getElementById('modalConfirmRegisterFace').disabled = false;
    document.getElementById('modalFaceName').disabled = false;
  }
}

        // --- Voice Registration Modal Logic ---
        let voiceMediaRecorder, voiceAudioChunks = [], voiceBlob = null;

        function openRegisterVoiceModal() {
            document.getElementById('voiceRegisterModal').style.display = 'flex';
            document.getElementById('voiceName').value = '';
            document.getElementById('registerVoiceError').textContent = '';
            document.getElementById('registerVoiceProgress').style.display = 'none';
            document.getElementById('registerVoiceProgressFill').style.width = '0%';
            document.getElementById('startVoiceRecord').style.display = 'inline-block';
            document.getElementById('stopVoiceRecord').style.display = 'none';
            document.getElementById('confirmRegisterVoice').disabled = true;
            voiceBlob = null;
        }
        document.getElementById('showRegisterVoice').onclick = openRegisterVoiceModal;
        document.getElementById('closeVoiceRegisterModal').onclick = function() {
            document.getElementById('voiceRegisterModal').style.display = 'none';
            if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') voiceMediaRecorder.stop();
        };

        document.getElementById('startVoiceRecord').onclick = async function() {
            voiceAudioChunks = [];
            document.getElementById('voiceRecordStatus').textContent = 'Recording... Speak now!';
            document.getElementById('startVoiceRecord').style.display = 'none';
            document.getElementById('stopVoiceRecord').style.display = 'inline-block';
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            voiceMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            voiceMediaRecorder.ondataavailable = e => voiceAudioChunks.push(e.data);
            voiceMediaRecorder.onstop = () => {
                voiceBlob = new Blob(voiceAudioChunks, { type: 'audio/webm' });
                document.getElementById('voiceRecordStatus').textContent = 'Recording complete.';
                document.getElementById('confirmRegisterVoice').disabled = false;
                stream.getTracks().forEach(track => track.stop());
            };
            voiceMediaRecorder.start();
        };
        document.getElementById('stopVoiceRecord').onclick = function() {
            if (voiceMediaRecorder && voiceMediaRecorder.state !== 'inactive') voiceMediaRecorder.stop();
            document.getElementById('stopVoiceRecord').style.display = 'none';
            document.getElementById('startVoiceRecord').style.display = 'inline-block';
        };
        document.getElementById('confirmRegisterVoice').onclick = async function() {
            const name = document.getElementById('voiceName').value.trim();
            if (!name) {
                document.getElementById('registerVoiceError').textContent = 'Please enter your name.';
                return;
            }
            if (!voiceBlob) {
                document.getElementById('registerVoiceError').textContent = 'Please record your voice.';
                return;
            }
            document.getElementById('registerVoiceError').textContent = '';
            document.getElementById('registerVoiceProgress').style.display = 'block';
            document.getElementById('registerVoiceProgressFill').style.width = '0%';
            document.getElementById('confirmRegisterVoice').disabled = true;
            // Convert to WAV/16kHz on backend if needed
            const formData = new FormData();
            formData.append('name', name);
            formData.append('audio', voiceBlob, 'audio.webm');
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 20 + 10;
                if (progress > 100) progress = 100;
                document.getElementById('registerVoiceProgressFill').style.width = progress + '%';
                if (progress >= 100) clearInterval(interval);
            }, 200);
            try {
                const res = await fetch('http://127.0.0.1:5000/register_voice', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('voiceRegisterModal').style.display = 'none';
                    showResultPopup(true, 'Voice Registration Successful', {
                        summary: `🎤 <b>${name}</b> registered!`,
                        findings: [],
                        tip: 'You can now authenticate with your voice.',
                        type: 'success',
                        features: []
                    });
                } else {
                    document.getElementById('registerVoiceError').textContent = data.error || 'Unknown error.';
                    document.getElementById('confirmRegisterVoice').disabled = false;
                }
            } catch (err) {
                document.getElementById('registerVoiceError').textContent = err.message;
                document.getElementById('confirmRegisterVoice').disabled = false;
            }
        };

        // --- Real Voice Authentication (Backend) ---
        async function startVoiceAuth() {
            const useBackend = true; // Always use backend for real voice auth
            if (useBackend) {
                // Record audio for recognition
                let audioChunks = [], recBlob = null;
                updateStatus('voiceStatus', 'Listening for voice pattern...', 'processing');
                document.getElementById('voiceBtn').disabled = true;
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                rec.ondataavailable = e => audioChunks.push(e.data);
                rec.onstop = async () => {
                    recBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    stream.getTracks().forEach(track => track.stop());
                    // Send to backend
                    const formData = new FormData();
                    formData.append('audio', recBlob, 'audio.webm');
                    try {
                        const res = await fetch('http://127.0.0.1:5000/recognize_voice', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        if (data.success && data.name && data.name !== 'Unknown') {
                            showResultPopup(true, 'Voice Recognized!', {
                                summary: `🎤 <b>${data.name}</b> recognized!`,
                                findings: [
                                    `Score: ${data.score ? data.score.toFixed(2) : 'N/A'}`
                                ],
                                tip: 'Welcome back, ' + data.name + '!',
                                type: 'success',
                                features: []
                            });
                            updateStatus('voiceStatus', 'Voice authentication successful', 'success');
                            document.getElementById('voiceData').innerHTML = generateBiometricData('voice');
                        } else if (data.success && data.name === 'Unknown') {
                            showResultPopup(false, 'Voice Not Recognized', {
                                summary: 'No match found in the database.',
                                findings: [
                                    `Score: ${data.score ? data.score.toFixed(2) : 'N/A'}`
                                ],
                                tip: 'Try registering your voice first.',
                                type: 'failure',
                                features: []
                            });
                            updateStatus('voiceStatus', 'Voice authentication failed', 'error');
                        } else {
                            showResultPopup(false, 'Recognition Failed', {
                                summary: data.error || 'Unknown error',
                                findings: [],
                                tip: 'Check your backend and try again.',
                                type: 'failure',
                                features: []
                            });
                            updateStatus('voiceStatus', 'Voice authentication failed', 'error');
                        }
                    } catch (err) {
                        showResultPopup(false, 'Recognition Error', {
                            summary: err.message,
                            findings: [],
                            tip: 'Is your backend running?',
                            type: 'failure',
                            features: []
                        });
                        updateStatus('voiceStatus', 'Voice authentication failed', 'error');
                    }
                    document.getElementById('voiceBtn').disabled = false;
                    checkMFAReadiness();
                    updateMetrics();
                };
                rec.start();
                setTimeout(() => {
                    if (rec.state !== 'inactive') rec.stop();
                }, 3000); // Record for 3 seconds
            } else {
                // Simulation (original logic)
                authData.attempts++;
                updateMetrics();
                updateStatus('voiceStatus', 'Listening for voice pattern...', 'processing');
                document.getElementById('voiceBtn').disabled = true;
                setTimeout(() => {
                    showFaceDetection();
                }, 1000);
                let progress = 0;
                const progressInterval = setInterval(() => {
                    progress += Math.random() * 12;
                    document.getElementById('voiceProgress').style.width = progress + '%';
                    if (progress >= 100) {
                        clearInterval(progressInterval);
                        const success = Math.random() > 0.25; // 75% success rate
                        if (success) {
                            authData.voice = true;
                            updateStatus('voiceStatus', 'Voice authentication successful', 'success');
                            document.getElementById('voiceData').innerHTML = generateBiometricData('voice');
                            logActivity('Voice authentication successful', 'success');
                            showResultPopup(true, 'Voice authentication successful');
                        } else {
                            authData.failures++;
                            updateStatus('voiceStatus', 'Voice authentication failed', 'error');
                            logActivity('Voice authentication failed', 'error');
                            showResultPopup(false, 'Voice authentication failed');
                        }
                        document.getElementById('voiceBtn').disabled = false;
                        checkMFAReadiness();
                        updateMetrics();
                    }
                }, 250);
            }
        }

        // Recognize a face
        async function recognizeFace() {
            const image = getWebcamBase64();
            showFaceRecognitionResult('Recognizing...', true);
            const res = await fetch('http://127.0.0.1:5000/recognize_face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image })
            });
            const data = await res.json();
            if (data.success) {
                if (data.name && data.name !== 'Unknown') {
                    showFaceRecognitionResult(
                        `👤 <b>${data.name}</b> recognized!<br>Confidence: ${data.confidence.toFixed(2)}`,
                        true
                    );
                } else {
                    showFaceRecognitionResult('Face not recognized.', false);
                }
            } else {
                showFaceRecognitionResult('❌ Recognition failed: ' + data.error, false);
            }
        }

        // Show result in the UI
        function showFaceRecognitionResult(msg, success) {
            const el = document.getElementById('faceRecognitionResult');
            el.innerHTML = msg;
            el.style.color = success ? '#28a745' : '#dc3545';
        }

        window.addEventListener('error', function(event) {
          showResultPopup(false, 'JavaScript Error', {
            summary: event.message,
            findings: [event.filename + ':' + event.lineno],
            tip: 'Check the console for more details.',
            type: 'failure',
            features: []
          });
          event.preventDefault();
        });

        // At the end of the file, expose functions to global scope for HTML onclick
        window.openRegisterVoiceModal = openRegisterVoiceModal;
        window.openRegisterFaceModal = openRegisterFaceModal;
        window.startFingerprintAuth = startFingerprintAuth;