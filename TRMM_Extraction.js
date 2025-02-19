/**  
 * =============================================================  
 * TRMM 3B42 Daily and Annual Precipitation Extraction for Gheba Basin  
 * =============================================================  
 * Author: HUNDESA SIRAJ MOHAMMED  
 * Student at University of Padua  
 * Department of Water and Geological Risk Engineering  
 *  
 * Thesis Title:  
 * "Basin-scale hydrological impacts from climatic changes:  
 *  a model assessment in the Horn of Africa"  
 *  
 * Description:  
 * Extracts daily and annual precipitation data from the TRMM 3B42 dataset  
 * for the Gheba Basin from 1999-2002. Computes total daily precipitation  
 * and exports as CSV, and generates an annual precipitation raster for each year.  
 *  
 * Dataset Used: TRMM 3B42 (3-hourly precipitation dataset)  
 *  
 * Outputs:  
 * - CSV file of daily precipitation values  
 * - GeoTIFF file of the annual precipitation for each year  
 */

// ===================== //
// 1. DEFINE REGION OF INTEREST (ROI) //
// ===================== //
// Replace 'roi' with your coordinates or shapefile for the Gheba Basin
// var roi = /* Define your ROI here */;

// ===================== //
// 2. LOAD TRMM 3B42 PRECIPITATION DATASET //
// ===================== //
// Load the TRMM 3B42 dataset (3-hourly resolution)
var trmm = ee.ImageCollection('TRMM/3B42')
            .filterBounds(roi)
            .filterDate('1999-01-01', '2003-01-01')
            .select('precipitation');

// ===================== //
// 3. COMPUTE DAILY PRECIPITATION //
// ===================== //
var dailyPrecip = ee.ImageCollection(
  ee.List.sequence(0, ee.Date('2003-01-01').difference(ee.Date('1999-01-01'), 'days').subtract(1))
  .map(function(dayOffset) {
    var start = ee.Date('1999-01-01').advance(dayOffset, 'days');
    var end = start.advance(1, 'day');
    var dailySum = trmm.filterDate(start, end)
                      .sum()
                      .multiply(3) // Convert from mm/hr to mm per day
                      .set('date', start.format('YYYY-MM-dd'));
    return dailySum;
  })
);

// Reduce the daily images over the ROI to get daily mean precipitation
var dailyTable = dailyPrecip.map(function(image) {
  var date = image.get('date');
  var meanPrecip = image.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: roi,
    scale: 27830,
    maxPixels: 1e13
  }).get('precipitation');

  return ee.Feature(null, { 'date': date, 'TRMM_Daily_Precip_mm': meanPrecip });
});

// Export daily precipitation as a CSV
Export.table.toDrive({
  collection: ee.FeatureCollection(dailyTable),
  description: 'TRMM_GHEBA_BASIN_Daily_Precipitation_1999_2002',
  fileFormat: 'CSV'
});

// ===================== //
// 4. EXPORT ANNUAL PRECIPITATION AS GEOTIFF //
// ===================== //
var annualPrecipitation = ee.ImageCollection(
  ee.List.sequence(1999, 2002).map(function(year) {
    var yearlyData = trmm
      .filter(ee.Filter.calendarRange(year, year, 'year'))
      .sum()
      .multiply(3) // Convert from mm/hr to mm per year
      .set('year', year);
    return yearlyData;
  })
);

// Compute the mean annual precipitation raster
var avgAnnualPrecip = annualPrecipitation.mean().clip(roi);

// Export the GeoTIFF file
Export.image.toDrive({
  image: avgAnnualPrecip,
  description: 'TRMM_Avg_Annual_Precipitation_1999_2002',
  scale: 27830,
  region: roi,
  fileFormat: 'GeoTIFF'
});
