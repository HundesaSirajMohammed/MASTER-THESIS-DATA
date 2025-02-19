/**  
 * =============================================================  
 * CHIRPS Daily and Annual Precipitation Extraction for Gheba Basin  
 * =============================================================  
 * Author: HUNDESA SIRAJ MOHAMMED  
 * Student at University of Padua  
 * Department of Water and Geological Risk Engineering  
 *  
 * Description:  
 * Extracts CHIRPS daily precipitation data for the Gheba Basin from 1999-2002.  
 * Computes total annual precipitation for each year and exports as GeoTIFF.  
 *  
 * Dataset Used: UCSB CHIRPS DAILY Precipitation Dataset  
 *  
 * Outputs:  
 * - CSV file of daily precipitation values  
 * - GeoTIFF file of the average annual precipitation  
 */

// Define Region of Interest (ROI)
var roi = /* Define your ROI here */;

// Define the years (1999-2002)
var years = ee.List.sequence(1999, 2002);

// Load CHIRPS daily precipitation data
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
                .filterBounds(roi)
                .select('precipitation');

// Compute total annual precipitation for each year
var annualPrecip = ee.ImageCollection(years.map(function(year) {
    var startDate = ee.Date.fromYMD(year, 1, 1);
    var endDate = ee.Date.fromYMD(year, 12, 31);
    return chirps.filterDate(startDate, endDate).sum().clip(roi).set('year', year);
}));

// Compute average annual precipitation over 1999-2002
var avgAnnualPrecip = annualPrecip.mean().clip(roi);

// Export as GeoTIFF
Export.image.toDrive({
    image: avgAnnualPrecip,
    description: 'CHRPS_Avg_Annual_Precip_1999_2002',
    scale: 5566,
    region: roi,
    fileFormat: 'GeoTIFF'
});

// Compute daily precipitation and export as CSV
var dailyPrecip = chirps.map(function(image) {
    var date = image.date().format('YYYY-MM-dd');
    var totalDailyPrecip = image.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: roi,
        scale: 5566,
        maxPixels: 1e13
    }).set('date', date);
    return ee.Feature(null, totalDailyPrecip).set('date', date);
});

Export.table.toDrive({
    collection: ee.FeatureCollection(dailyPrecip),
    description: 'Gheba_CHIRPS_Daily_Precip_1999_2002',
    fileFormat: 'CSV'
});
