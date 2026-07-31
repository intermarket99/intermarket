import React, { useRef, useEffect, useState } from 'react';
import './DasboardAdmin.css';

const loadTableauScript = () => {
  return new Promise((resolve, reject) => {
    if (window.tableau) {
      resolve(window.tableau);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://public.tableau.com/javascripts/api/tableau-2.9.2.min.js';
    script.async = true;
    script.onload = () => {
      if (window.tableau && typeof window.tableau.Viz === 'function') {
        resolve(window.tableau);
      } else {
        reject(new Error('Tableau API no se cargó correctamente o no exportó Viz'));
      }
    };

    script.onerror = () => reject(new Error('No se pudo cargar el script de Tableau'));
    document.body.appendChild(script);
    
  });
};

export const DasboardAdmin = () => {
  const vizContainerRef = useRef(null);
  const vizRef = useRef(null);

  const vistaUrl = 'https://public.tableau.com/views/Intermaket_etl/DescuentosaplicadosenInterMaeket?:language=es-ES&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link';

  useEffect(() => {
    let isMounted = true;

    const initializeViz = async () => {
      if (!vizContainerRef.current) return;

      try {
        const tableau = await loadTableauScript();

        if (!isMounted) return;

        const options = {
          hideTabs: false,
          toolbar: 'bottom',
          onFirstInteractive: () => {
            console.log('¡El tablero de Tableau está listo!');
          },
        };

        vizRef.current = new tableau.Viz(vizContainerRef.current, vistaUrl, options);
      } catch (error) {
        console.error('Error inicializando Tableau:', error);
      }
    };

    initializeViz();

    return () => {
      isMounted = false;
      if (vizRef.current) {
        vizRef.current.dispose();
      }
    };
  }, [vistaUrl]);


  // Segundo dashboard: usar refs y useEffect separados (no hooks dentro de funciones anidadas)
  const vizContainerRef2 = useRef(null);
  const vizRef2 = useRef(null);

  const vistaUrl2 = 'https://public.tableau.com/views/Intermaket_etl/PromediodeVentasporTiendaenlaAplicacin?:language=es-ES&:sid=&:redirect=auth&:display_count=n&:origin=viz_share_link';

  useEffect(() => {
    let isMounted = true;

    const initializeViz2 = async () => {
      if (!vizContainerRef2.current) return;

      try {
        const tableau = await loadTableauScript();

        if (!isMounted) return;

        const options = {
          hideTabs: false,
          toolbar: 'bottom',
          onFirstInteractive: () => {
            console.log('¡El segundo tablero de Tableau está listo!');
          },
        };

        vizRef2.current = new tableau.Viz(vizContainerRef2.current, vistaUrl2, options);
      } catch (error) {
        console.error('Error inicializando segundo Tableau:', error);
      }
    };

    initializeViz2();

    return () => {
      isMounted = false;
      if (vizRef2.current) {
        vizRef2.current.dispose();
      }
    };
  }, [vistaUrl2]);

  // Tercer dashboard: usar refs y useEffect separados (no hooks dentro de funciones anidadas)
  const vizContainerRef3 = useRef(null);
  const vizRef3 = useRef(null);
  const [embed3Available, setEmbed3Available] = useState(true);

  // Usar variante /views con parámetros de embed; si sigue fallando mostramos fallback
  const vistaUrl3 = 'https://public.tableau.com/views/Intermaket_etl/anlisisdecomprasrealizadasdentrodelaaplicacin?:language=es-ES&:display_count=n&:origin=viz_share_link&:embed=y&:showVizHome=no';

  useEffect(() => {
    let isMounted = true;

    const initializeViz3 = async () => {
      if (!vizContainerRef3.current) return;

      try {
        const tableau = await loadTableauScript();

        if (!isMounted) return;

        const options = {
          hideTabs: false,
          toolbar: 'bottom',
          onFirstInteractive: () => {
            console.log('¡El tercer tablero de Tableau está listo!');
          },
        };

        vizRef3.current = new tableau.Viz(vizContainerRef3.current, vistaUrl3, options);
      } catch (error) {
        console.error('Error inicializando tercer Tableau:', error);
        setEmbed3Available(false);
      }
    };

    initializeViz3();

    return () => {
      isMounted = false;
      if (vizRef3.current) {
        vizRef3.current.dispose();
      }
    };
  }, [vistaUrl3]);

  return (
    <div className="dashboard-wrapper">
      <h2 style={{margin:'0 0 18px 0', color:'#0f172a'}}>Panel de Administración</h2>

      <div className="dashboards">
        <section className="chart chart--primary" aria-labelledby="chart-1-title">
          <div className="chart-header">
            <div>
              <div id="chart-1-title" className="chart-title">Descuentos aplicados</div>
              <div className="chart-subtitle">Resumen de descuentos por campaña</div>
            </div>
          </div>
          <div ref={vizContainerRef} className="viz-container" />
        </section>

        <section className="chart chart--secondary" aria-labelledby="chart-2-title">
          <div className="chart-header">
            <div>
              <div id="chart-2-title" className="chart-title">Promedio de ventas</div>
              <div className="chart-subtitle">Por tienda</div>
            </div>
          </div>
          <div ref={vizContainerRef2} className="viz-container" />
        </section>

        <section className="chart chart--tertiary" aria-labelledby="chart-3-title">
          <div className="chart-header">
            <div>
              <div id="chart-3-title" className="chart-title">Análisis de compras</div>
              <div className="chart-subtitle">Comportamiento dentro de la aplicación</div>
            </div>
            <div>
              {embed3Available ? null : (
                <a href={vistaUrl3} target="_blank" rel="noreferrer" style={{fontSize:12, color:'#0f172a'}}>Abrir en nueva pestaña</a>
              )}
            </div>
          </div>
          {embed3Available ? (
            <div ref={vizContainerRef3} className="viz-container" />
          ) : (
            <div style={{padding:16, borderRadius:10, background:'#f8fafc'}}>El informe no puede incrustarse aquí. <a href={vistaUrl3} target="_blank" rel="noreferrer">Ábralo en una nueva pestaña</a>.</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DasboardAdmin;