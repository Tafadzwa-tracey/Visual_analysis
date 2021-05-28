import {
  getLabel,
  ValueAttributes,
  FieldAttributes,
  NumOfStates,
  Group5Color,
  Group10Color
} from './Common/AttributesDefs';
import { format, zoom } from 'd3';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import ReactDropdown from 'react-dropdown';
import { config } from './config';
import { useData, useDataOnlyOnce } from './Data/useData';
import { getUsAtlas } from './Data/getUsAtlas';
import { getSumData } from './Data/sumDataByYear';
import { getTopNStateData } from './Data/sumData';
import {
  getFilteredData,
  getState2ValueMap,
  getTopNStatesFlag
} from './Data/FilterData';
import { getSumData2, getSumDataAll } from './Data/sumDataByState';
import { BarColorMark } from './BarColorMark/Bar-index.js';
import { MapColorMark } from './MapColorMark/Map-index.js';
import { LineColorMark } from './LineColorMark/Line-index.js';

//Part I: Global values
const width = 960;
const menuHeight = 60;
const height = 500 - menuHeight;
const margin = { top: 10, right: 30, bottom: 65, left: 90 };
const xAxisLabelOffset = 30;
const yAxisLabelOffset = 50;
const innerHeight = height - margin.top - margin.bottom;
const innerWidth = width - margin.left - margin.right;
const halfWidth = (innerWidth - 20) / 2;
const halfHeight = (innerHeight - 20) / 2;
const halfMarginX = 30;
const halfMarginY = 40;
const leftMarginX = 140;
//Interaction related
const fadeOpacity = 0.2;
const normalOpacity = 0.8;
const highlightOpacity = 0.96;

//Part II: Main functiond
const App = () => {
  const [hoveredYearValue, setHoveredYearValue] = useState(null);
  const [hoveredStateValue, setHoveredStateValue] = useState(null);
  const [selectYearValue, setSelectedYearValue] = useState(null);
  const [selectStateValue, setSelectedStateValue] = useState(null);

  const handleResetButtonClick = e => {
    e.preventDefault();
    setSelectedYearValue(null);
    setSelectedStateValue(null);
    console.log('The reset button is clicked.');
  };

  //Step 0: Menu with attribute selections
  //xValue and yValues are defined here
  const initialXAttribute = 'Week';
  const [xAttribute, setXAttribute] = useState(initialXAttribute);
  const xValue = d => d[xAttribute];
  //  xLabel is fixed for X
  const xAxisLabel = getLabel(xAttribute, FieldAttributes);

  const initialYAttribute = 'ILI_Percent';
  const [yAttribute, setYAttribute] = useState(initialYAttribute);
  const yValue = d => d[yAttribute];
  const yAxisLabel = getLabel(yAttribute, ValueAttributes);

  const initialNumState = '10';
  const [topStateNum, setTopStateNum] = useState(initialNumState);

  //  const data = useData();
  const data = useData();
  const usAtlas = getUsAtlas();

  if (!data || !usAtlas) {
    return <pre>Loading...</pre>;
  }
  console.log('Data loading is done.');

  const siFormat2 = format('4d');
  //const siFormat1 = format('.2g');
  const siFormat = format('.2s');
  const xAxisTickFormat = tickValue => siFormat(tickValue).replace('G', 'B');
  const xAxisTickFormatYear = tickValue =>
    siFormat2(tickValue).replace('G', 'B');

  //hoverOpacity value definitions
  const hoverOpacityYear =
    hoveredYearValue !== null ? highlightOpacity : normalOpacity;
  const fadeOrNormalOpacityYear =
    hoveredYearValue !== null ? fadeOpacity : normalOpacity;
  const hoverOpacityState =
    hoveredStateValue !== null ? highlightOpacity : normalOpacity;
  const fadeOrNormalOpacityState =
    hoveredStateValue !== null ? fadeOpacity : normalOpacity;

  //Step 1: Derived data from here for plot:4-1 Line chart
  //Move into LineColorMark
  const colorValue = d => d.Year;
  const sizeValue = d => d.ILI_Total;
  const tooltipValue = d => d.ILI_Total;
  const color2ndValue = d => d.State;

  //const sumDataByYear = useMemo(() => (getSumData(data, yValue)), [data, yValue]);
  const sumDataByYear = getSumData(data, yValue);
  //  console.log(sumDataByYear);
  //console.log('Called sumData by year.');

  //Step 2: US map for all states plot: 4-2
  const yearId = hoveredYearValue !== null ? hoveredYearValue : selectYearValue;
  //  console.log('------ Hover or selection year: ', yearId);

  const filteredDataAll = getFilteredData(data, null);
  const filteredData = getFilteredData(data, yearId);
  //  console.log(filteredData);
  const sumDataAllState = getSumDataAll(filteredData, yValue, color2ndValue);
  const stateToValue = d => d.avg;
  const state2ValueMap = getState2ValueMap(sumDataAllState, stateToValue);
  //  console.log(state2ValueMap);

  //Step 3: Derived data from here for plot: 4-3 Bar chart
  const topNStatesData = getTopNStateData(filteredData, yValue, topStateNum);
  //  console.log(topNStatesData);
  //console.log('Called getTopNStateData by year.');

  const yBarValue = d => d.State;
  const xBarValue = d => d.Tvalue;

  //Step 4: Derived line plot: 4-4 Curve chart
  const top10States = getTopNStatesFlag(filteredDataAll, topNStatesData);
  //  console.log(top10States);
  const sumData10State = getSumData2(top10States, yValue, color2ndValue);
  //  console.log(sumData10State);
  //console.log('Called getSumData2 by state.');

  //Step 5: Draw plots using svg, other controls: ReactDropdown
  return (
    <>
      <div className="menus-container">
        <span className="dropdown-label">Choose a data field:</span>
        <ReactDropdown
          options={ValueAttributes}
          value={yAttribute}
          onChange={({ value }) => setYAttribute(value)}
        />
        <span className="dropdown-label"> </span>
        <button className="button" onClick={handleResetButtonClick}>
          {' '}
          Reset{' '}
        </button>
        <span className="dropdown-label">Top N States:</span>
        <ReactDropdown
          options={NumOfStates}
          value={topStateNum}
          onChange={({ value }) => setTopStateNum(value)}
        />
      </div>
      <svg width={width} height={height}>
        <g
          transform={`translate(${margin.left + halfWidth + halfMarginX},${
            margin.top
          }) scale(0.995 0.995)`}
        >
          <svg
            width={halfWidth}
            height={halfHeight + 20}
            viewBox={`0 0 ${width} ${height + 60}`}
            zoomAndPan={'zoomAndPan'}
            zoom={zoom().on('zoom', () => {
              g.attr('transform', event.transform);
            })}
          >
            <MapColorMark
              data={sumDataAllState}
              atlas={usAtlas}
              avgValue={stateToValue}
              topStates={topNStatesData}
              colorValue={color2ndValue}
              innerWidth={halfWidth}
              innerHeight={halfHeight}
              tooltipValue={yBarValue}
              tooltipFormat={xAxisTickFormat}
              setSelectedValue={setSelectedStateValue}
              selectedValue={selectStateValue}
              setHoveredValue={setHoveredStateValue}
              hoveredValue={hoveredStateValue}
              hoverOpacity={'0.45'}
              fadeOpacity={'1.0'}
            />
          </svg>
        </g>
        <g
          transform={`translate(${margin.left + 5},${margin.top +
            halfHeight +
            halfMarginY})`}
        >
          <BarColorMark
            data={topNStatesData}
            xValue={xBarValue}
            yValue={yBarValue}
            colorValue={color2ndValue}
            topStates={topNStatesData}
            groupColorDefs={Group10Color}
            innerWidth={halfWidth}
            innerHeight={halfHeight}
            xAxisLabel={yAxisLabel}
            xAxisTickFormat={xAxisTickFormat}
            setSelectedValue={setSelectedStateValue}
            selectedValue={selectStateValue}
            setHoveredValue={setHoveredStateValue}
            hoveredValue={hoveredStateValue}
            hoverOpacity={normalOpacity}
            fadeOpacity={fadeOrNormalOpacityState}
          />
        </g>
        <g transform={`translate(${margin.left},${margin.top})`}>
          <LineColorMark
            data={sumDataByYear}
            xValue={xValue}
            yValue={yValue}
            sizeValue={sizeValue}
            colorValue={colorValue}
            groupColorDefs={Group5Color}
            innerWidth={halfWidth}
            innerHeight={halfHeight}
            xAxisLabel={xAxisLabel}
            yAxisLabel={yAxisLabel}
            xAxisTickFormat={xAxisTickFormatYear}
            tooltipValue={tooltipValue}
            setSelectedValue={setSelectedYearValue}
            selectedValue={selectYearValue}
            setHoveredValue={setHoveredYearValue}
            hoveredValue={hoveredYearValue}
            hoverOpacity={hoverOpacityYear}
            fadeOpacity={fadeOrNormalOpacityYear}
          />
        </g>
        <g
          transform={`translate(${margin.left +
            2 +
            halfWidth +
            halfMarginX +
            leftMarginX},${margin.top + halfHeight + halfMarginY})`}
        >
          <LineColorMark
            data={sumData10State}
            xValue={colorValue}
            yValue={yValue}
            sizeValue={sizeValue}
            colorValue={color2ndValue}
            colorDomain={topNStatesData}
            groupColorDefs={Group10Color}
            innerWidth={halfWidth - leftMarginX}
            innerHeight={halfHeight}
            legendOnLeft={'true'}
            xAxisLabel={'Year'}
            yAxisLabel={yAxisLabel}
            xAxisTickFormat={xAxisTickFormatYear}
            tooltipValue={tooltipValue}
            setSelectedValue={setSelectedStateValue}
            selectedValue={selectStateValue}
            setHoveredValue={setHoveredStateValue}
            hoveredValue={hoveredStateValue}
            hoverOpacity={hoverOpacityState}
            fadeOpacity={fadeOrNormalOpacityState}
          />
        </g>
      </svg>
    </>
  );
};

const rootElement = document.getElementById('root');
ReactDOM.render(<App />, rootElement);
