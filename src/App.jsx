import { useState, useRef, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3-force';
import graphData from './data.json';
import './App.css';

function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  
  // --- MOBİL İYİLEŞTİRME: Başlangıç Boyutları ---
  // resize olayını beklemek yerine başlangıçta direkt alalım
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });
  
  const graphRef = useRef();

  // Ekran boyutu değiştiğinde grafiği yeniden boyutlandır
  useEffect(() => {
    const handleResize = () => setDimensions({ 
      width: window.innerWidth, 
      height: window.innerHeight 
    });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FİZİK MOTORUNU YAPILANDIR (Agresif metin çakışma önleme) ---
  useEffect(() => {
    if (graphRef.current) {
      // Düğümleri ve metinleri güçlü bir şekilde it
      graphRef.current.d3Force('charge').strength(-400);

      // Bağlantı mesafesini ayarla
      graphRef.current.d3Force('link').distance(node => {
        return node.source.id === 'Hasan' ? 100 : 70;
      });

      // Çarpışma kuvveti (Metin okunabilirliği için)
      graphRef.current.d3Force('collide', d3.forceCollide(node => node.val * 2));
    }
  }, []);

  const getNodeColor = (group) => {
    const colors = {
      1: '#ff6b6b', // Merkez: Kırmızı
      2: '#4dabf7', // Yazılım: Mavi
      4: '#51cf66', // Biyoinformatik: Yeşil
      5: '#cc5de8'  // Kişisel: Mor
    };
    return colors[group] || '#adb5bd';
  };

  // --- MOBİL İYİLEŞTİRME: Tıklama Yakınlaştırması ---
  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    
    // Tıklanan düğüme kamerayı odakla
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 800);
      
      // Mobil ekran dar olduğu için çok fazla yakınlaştırma (varsayılan 2.2'ydi)
      // Yakınlaştırmayı 1.8 veya 2.0 yapalım ki etraftaki düğümler de görünsün
      graphRef.current.zoom(2.0, 800); 
    }
  }, []);

  return (
    <div className="app-container minimal-theme">
      {/* Sol taraf: İnteraktif Minimal 2D Grafik */}
      <div className="graph-area">
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={null} // Varsayılan etiketi kapat, kendimiz çizeceğiz
          
          // Düğüm Çizimi (Aynı kalıyor)
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale; // Font boyutunu yakınlaştırmaya göre ayarla (12px)
            const color = getNodeColor(node.group);
            
            // 1. Parlama Efekti
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            
            // 2. Daire (Düğüm)
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val * 1.2, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            
            ctx.shadowBlur = 0; // Parlamayı kapat (yazı net olsun)

            // 3. İsim Etiketi (Kontur ve Çizim)
            ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`; // Font weight 600
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Kontur (Stroke) - Okunabilirlik için kritik
            ctx.lineWidth = 4 / globalScale;
            ctx.strokeStyle = '#1a1a1a'; // Arka planla aynı
            ctx.strokeText(label, node.x, node.y + (node.val * 1.2) + fontSize + 2);

            // Asıl Metin
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, node.x, node.y + (node.val * 1.2) + fontSize + 2);
          }}
          
          // Bağlantı Çizimi (Particles)
          linkColor={() => 'rgba(255, 255, 255, 0.15)'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => 'rgba(255, 255, 255, 0.6)'}
          
          onNodeClick={handleNodeClick}
          backgroundColor="#1a1a1a"
          
          // --- MOBİL İYİLEŞTİRME: Başlangıç Odaklanması ---
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              // Mobil ekranlar dar olduğu için kenar boşluğunu artır (Varsayılan 70'ti)
              // 120 veya 150px boşluk bırak ki grafik sığsın.
              graphRef.current.zoomToFit(400, 150); 
            }
          }}
        />
      </div>

      {/* Sağ taraf: Detay Paneli */}
      {selectedNode && (
        <div className="detail-panel">
          <button className="close-btn" onClick={() => setSelectedNode(null)}>✕</button>
          <div 
            className="node-badge" 
            style={{ backgroundColor: getNodeColor(selectedNode.group) }}
          >
            Öğrenme Alanı
          </div>
          <h2>{selectedNode.name}</h2>
          <hr />
          <p>{selectedNode.desc}</p>
        </div>
      )}
    </div>
  );
}

export default App;