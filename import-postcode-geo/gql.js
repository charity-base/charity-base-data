module.exports = `
  query GET_ONE($value: String!) {
    postcodes {
      get(value: $value) {
        id
        active
        stats {
          imd
        }
        coordinates {
          lat
          lon
          easting
          northing
        }
        codes {
          osgrdind
          usertype
          pcd
          pcd2
          pcds
          oa11
          cty
          ced
          laua
          ward
          hlthau
          nhser
          ctry
          rgn
          pcon
          eer
          teclec
          ttwa
          pct
          nuts
          park
          lsoa11
          msoa11
          wz11
          ccg
          bua11
          buasd11
          lep1
          lep2
          pfa
          calncv
          stp
          ru11ind
          oac11
        }
        names {
          ccg
          cty
          eer
          laua
          lsoa11
          msoa11
          ward
          ttwa
          pcon
          ru11ind
        }
      }
    }
  }
`
