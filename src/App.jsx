import { useState, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3-force'; // Fizik motorunu kontrol etmek için D3
import graphData from './data.json';
import './App.css';

function App() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const graphRef = useRef();

  // 1. Ekran boyutu değiştiğinde grafiği yeniden boyutlandır
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. FİZİK MOTORUNU YAPILANDIR (Metin çakışmalarını önlemek için)
  useEffect(() => {
    if (graphRef.current) {
      // Düğümleri birbirinden daha güçlü bir şekilde it (itme gücünü artırdık)
      graphRef.current.d3Force('charge').strength(-400);

      // Bağlantı mesafesini artır (Merkezden çıkan bağlantılar daha uzun)
      graphRef.current.d3Force('link').distance(node => {
        return node.source.id === 'Hasan' ? 100 : 70;
      });

      // Çarpışma kuvveti ekle (Düğümlerin üst üste binmesini engelle)
      graphRef.current.d3Force('collide', d3.forceCollide(node => node.val * 2));
    }
  }, []); // Sadece bileşen yüklendiğinde bir kez çalışır

  // Grup numarasına göre renk ataması (Daha yumuşak tonlar)
  const getNodeColor = (group) => {
    const colors = {
      1: '#ff6b6b', // Merkez: Kırmızı
      2: '#4dabf7', // Yazılım: Mavi
      4: '#51cf66', // Biyoinformatik: Yeşil
      5: '#cc5de8'  // Kişisel: Mor
    };
    return colors[group] || '#adb5bd';
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    // Tıklanan düğüme kamerayı odakla
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 800);
      graphRef.current.zoom(2.2, 800);
    }
  };

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
          
          // DÜĞÜM VE METİN ÇİZİMİ (Okunabilirlik ve çakışma iyileştirmesi)
          nodeCanvasObject={(node, ctx, globalScale) => {
            const color = getNodeColor(node.group);
            const nodeRadius = node.val * 1.2;

            // 1. Düğüm Çizimi (Parlama)
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI, false);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.shadowBlur = 0; // Parlamayı kapat

            // 2. Metin Etiketi Çizimi (Kontur Eklendi)
            const label = node.name;
            const fontSize = 12 / globalScale; // Font boyutunu küçülttük (12px)
            
            ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`; // Font kalınlığını (weight) artırdık (600)
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Metnin etrafına bir kontur (stroke) ekleyerek arka plandan ayrılmasını sağlayalım.
            // Bu, metnin okunabilirliğini inanılmaz derecede artırır.
            ctx.lineWidth = 4 / globalScale; // Kontur kalınlığı
            ctx.strokeStyle = '#1a1a1a'; // Arka plan rengiyle aynı yap
            ctx.strokeText(label, node.x, node.y + nodeRadius + fontSize + 3); // Metni düğümün altına al

            // Metni asıl rengiyle üzerine çiz
            ctx.fillStyle = '#ffffff'; // Metin ana rengi
            ctx.fillText(label, node.x, node.y + nodeRadius + fontSize + 3); // Metni çiz
          }}
          
          // Bağlantı Çizimi (Particles)
          linkColor={() => 'rgba(255, 255, 255, 0.15)'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => 'rgba(255, 255, 255, 0.6)'}
          
          onNodeClick={handleNodeClick}
          backgroundColor="#1a1a1a" // Daha yumuşak bir koyu gri
          
          // Başlangıçta tüm grafiği ekrana sığdır (Kamerayı ayarla)
          cooldownTicks={100}
          onEngineStop={() => {
            if (graphRef.current) {
              graphRef.current.zoomToFit(400, 100); // Kenarlardan 100px boşluk bırak
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