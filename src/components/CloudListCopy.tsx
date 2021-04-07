import React, { useState, useEffect } from 'react';
import './CloudList.scss';
import { CloudApi, Cloud } from '../apiclient/CloudApi'
import { getDistanceFromLatLonInKm } from '../helper/DistanceCalculation'
import Dropdown from './Dropdown'
import { Option } from './SharedInterface'

interface IOptions {
  cloudNames: Option[],
  regions: Option[]
}

interface ISelectedValues {
  selectedCloud: string,
  selectedRegion: string,
  selectedCity: string,
}

interface ILocation {
  lat: number,
  lon: number
}

export const emptyOption: Option = { value: '', displayName: '-- select an option --' }

const CloudList = () => {
  const [isLoading, setIsloading] = useState<boolean>(false)
  const [clouds, setClouds] = useState<Cloud[]>([])
  const [options, setOptions] = useState<IOptions>({ cloudNames: [emptyOption], regions: [emptyOption] })
  const [selectedValues, setSelectedValues] = useState<ISelectedValues>({ selectedCloud: '', selectedRegion: '', selectedCity: '' })
  const [filteredItems, setFilteredItems] = useState<Cloud[]>([])
  const [location, setLocation] = useState<ILocation>({ lat: 60.1699, lon: 24.9384 }) // default to Helsinki's location

  useEffect(() => {
    const cloudApi = new CloudApi()
    setIsloading(true)
    cloudApi.getCloudList()
      .then(res => {
        setClouds(res || [])
        // now selectedCloud and selectedRegion are empty, so show all cloud options
        setFilteredItems(res || [])
      })
      .catch(() => setClouds([]))
      .finally(() => setIsloading(false))
    
    // get user's location by using the HTML5 geolocation API
    // ref: https://stackoverflow.com/questions/13840516/how-to-find-my-distance-to-a-known-location-in-javascript
    // improvement: show pop-up alert to ask for consent
    window.navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude })
    })
  }, [])

  useEffect(() => {
    const getCloudFullName = (name: string):string => {
      switch (name) {
        case 'aws':
          return 'Amazon Web Services'
        case 'azure':
          return 'Microsoft Azure'
        case 'google':
          return 'Google Cloud'
        case 'do':
          return 'DigitalOcean'
        case 'upcloud':
          return 'UpCloud'
        default:
          return name
      }
    }
  
    const populateCloudOptions = (): void => {
      if(clouds.length > 0) {
        const names = clouds.map((cloud: Cloud) => cloud.cloud_name.split('-')[0])
        const uniqueNames = Array.from(new Set(names))
        const formattedOptions = [] as Option[]
        uniqueNames.forEach((name) => {
          formattedOptions.push({ value: name, displayName: getCloudFullName(name)  })
        })
        setOptions(prev => ({ cloudNames: [emptyOption, ...formattedOptions], regions: prev.regions }))
      } else {
        setOptions(prev => ({ cloudNames: [emptyOption], regions: prev.regions }))
      }
    }
  
    const populateRegionOptions = (): void => {
      if(clouds.length > 0) {
        const regions = clouds.map(cloud => cloud.geo_region)
        const uniqueRegions = Array.from(new Set(regions))
        const formattedOptions = uniqueRegions.map(region => {
          const displayName = region.toLowerCase()
            .split(' ')
            .map((string) => string.charAt(0).toUpperCase() + string.substring(1))
            .join(' ')
          return { value: region, displayName }
        })
        setOptions(prev => ({ cloudNames: prev.cloudNames, regions: [emptyOption, ...formattedOptions] }))
      } else {
        setOptions(prev => ({ cloudNames: prev.cloudNames, regions: [emptyOption] }))
      }
    }

    populateCloudOptions()
    populateRegionOptions()
  }, [clouds])

  useEffect(() => {
    filterCloudByNameAndOrRegion()
  }, [selectedValues.selectedCloud, selectedValues.selectedRegion]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() =>  {
    const calculateDistances = (): Cloud[] => {
      let filteredList = filteredItems
      if(filteredList.length > 1) {
        filteredList.forEach((item: Cloud, index) => {
          filteredList[index].distance = getDistanceFromLatLonInKm(item.geo_latitude, item.geo_longitude, location.lat, location.lon)
        })
      }
      // otherwise, no need to sort and cal distances
      
      return filteredList
    }

    const sortDistanceAscen = (): void => {
      let data = calculateDistances()
      
      let sortedData = data.sort((a, b) => (a.distance? a.distance : 0) - (b.distance? b.distance : 0))
      setFilteredItems(sortedData)
    }

    sortDistanceAscen()
  }, [filteredItems, location.lat, location.lon])

  const filterCloudsByName = (name: string): Cloud[] => {
    const filtered = clouds.filter((cloud: Cloud) => {
      return cloud.cloud_name.includes(name)
    })
    return filtered
  }

  const filterCloudByRegion = (region: string, list: Cloud[]): Cloud[] => {
    const filtered = list.filter((item) => item.geo_region === region)
    return filtered
  }

  const filterCloudByNameAndOrRegion = (): void => {
    const name = selectedValues.selectedCloud
    const region = selectedValues.selectedRegion

    // if name only --> filter name 
    // if region only --> filter region
    // if name & region -->  filter name then region
    // if no name & region --> return the whole cloud list from API
    let filtered = clouds
    if(name) {
      filtered = filterCloudsByName(name)
    }
    if(region) {
      filtered = filterCloudByRegion(region, filtered)
    }
    setFilteredItems(filtered)
  }

  const handleCloudNameChange = (cloudName: string): void => {
    setSelectedValues(prev => ({ 
      selectedCloud: cloudName,
      selectedRegion: prev.selectedRegion,
      selectedCity: prev.selectedCity
    }))
  }

  const handleRegionChange = (region: string): void => {
    setSelectedValues(prev => ({
      selectedCloud: prev.selectedCloud,
      selectedRegion: region,
      selectedCity: prev.selectedCity
    }))
  }

  const handleCityChange = (e: React.SyntheticEvent): void => {
    const target  = e.target as HTMLSelectElement
    setSelectedValues(prev => ({
      selectedCloud: prev.selectedCloud,
      selectedRegion: prev.selectedRegion,
      selectedCity: target.value
    }))
  }

  const filteredResult = () => {
    if(filteredItems.length > 0) {
      return filteredItems.map((cloud: Cloud, index: number) =>
        <option value={cloud.cloud_description} key={cloud.cloud_description + index}>{cloud.cloud_description}{(filteredItems.length !== 1 && index === 0)? ' * Nearest' : ''}</option>
      )
    } else {
      return <option value=''>No cloud service available with your criteria</option>
    }
  }
  
  const selection = (
    <React.Fragment>
      <Dropdown 
        label="Select cloud"
        id="cloud"
        value={selectedValues.selectedCloud}
        handleOnChange={handleCloudNameChange}
        options={options.cloudNames} />
      <Dropdown 
        label="Select region"
        id="region"
        value={selectedValues.selectedRegion}
        handleOnChange={handleRegionChange}
        options={options.regions} />
      <div className="dropdown">
        <label htmlFor="city">
          Select city
          <small>(Listed from nearest to farest)</small>
        </label>
        <select name="city" id="city" onChange={handleCityChange} value={selectedValues.selectedCity}>
          {filteredResult()}
        </select>
      </div>
    </React.Fragment>
  )
    
  return(
    <div className="content-wrapper">
      {isLoading? <p>Loading ....</p> : selection}
    </div>
  )
}

export default CloudList;
