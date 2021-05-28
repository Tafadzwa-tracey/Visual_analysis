import { useState, useEffect } from 'react';
import { csv } from 'd3';

const csvUrl = './Fertility_data.csv';

export const useData = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const row = d => {
      d.Year = +d.YEAR;
      d.Week = +d.WEEK;
      d.State = d.REGION; //Need a lut to id related to map
      d.ILI_Percent = +d['FertilityRate'];
      d.ILI_Total = +d.Education;
      d.Providers = +d['Policy'];
      d.Pat_Total = +d['FamilyPlanning'];
      return d;
    };
    csv(csvUrl, row).then(setData);
  }, []);
  
  return data;
};
