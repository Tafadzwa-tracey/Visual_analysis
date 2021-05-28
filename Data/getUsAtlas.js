import { useState, useEffect } from 'react';
import { json } from 'd3';
import { feature, mesh } from 'topojson';

const jsonUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

export const getUsAtlas = () => {
  const [data, setData] = useState(null);

   useEffect(() => {
     json(jsonUrl).then(topology => {
       const { states, nation } = topology.objects;
       console.log('Load map file...');
       //debugger();
       setData({
         states: feature(topology, states),
         interiors: mesh(topology, states, (a, b) => a !== b)
       });
     });
   }, []);

  return data;
};

