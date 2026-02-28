'use client';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function DottedSurface({ className, ...props }) {
    const { theme } = useTheme();

    const containerRef = useRef(null);
    const sceneRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const SEPARATION = 100;
        const AMOUNTX = 50;
        const AMOUNTY = 50;

        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 2000, 10000);

        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            1,
            10000,
        );
        camera.position.set(0, 300, 800);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        container.appendChild(renderer.domElement);

        const positions = [];
        const colors = [];

        const geometry = new THREE.BufferGeometry();

        for (let ix = 0; ix < AMOUNTX; ix++) {
            for (let iy = 0; iy < AMOUNTY; iy++) {
                const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
                const y = 0;
                const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

                positions.push(x, y, z);
                colors.push(0.4, 0.2, 0.9);
            }
        }

        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3),
        );
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 6,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        let count = 0;

        const animate = () => {
            if (sceneRef.current) {
                sceneRef.current.animationId = requestAnimationFrame(animate);
            }

            const positionAttribute = geometry.attributes.position;
            const posArray = positionAttribute.array;

            let i = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    const index = i * 3;
                    posArray[index + 1] =
                        Math.sin((ix + count) * 0.3) * 50 +
                        Math.sin((iy + count) * 0.5) * 50;
                    i++;
                }
            }

            positionAttribute.needsUpdate = true;
            renderer.render(scene, camera);
            count += 0.05;
        };

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        sceneRef.current = { scene, camera, renderer, particles: [points], animationId: 0, count };

        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (sceneRef.current) {
                cancelAnimationFrame(sceneRef.current.animationId);
                sceneRef.current.renderer.dispose();
                sceneRef.current = null;
            }
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [theme]);

    return (
        <div
            ref={containerRef}
            className={cn('pointer-events-none fixed inset-0 -z-10 opacity-40', className)}
            {...props}
        />
    );
}
