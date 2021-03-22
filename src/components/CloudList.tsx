import React, { Component } from 'react';
import './CloudList.scss';
import { CloudApi, Cloud } from '../apiclient/CloudApi'
import { getDistanceFromLatLonInKm } from '../helper/DistanceCalculation'
import Dropdown from './Dropdown'
import { Option } from './SharedInterface'

class CloudList extends Component {

  state = {
    clouds: [] as Cloud[],
    isLoading: false,
    cloudNameOptions: [{ value: '', displayName: '' }] as Option[],
    regionOptions: [{ value: '', displayName: '' }] as Option[],
    selectedCloud: '' as string,
    selectedRegion: '' as string,
    selectedCity: '' as string,
    filteredItems: [] as Cloud[],
    location: {
      // default to Helsinki's location
      lat: 60.1699,
      lon: 24.9384
    }
  }

  componentDidMount() {
    const cloudApi = new CloudApi()
    this.setState({ isLoading: true }, () => {
      cloudApi.getCloudList()
        .then(res => {
          this.setState({ clouds: res || [], isLoading: false })
          this.setCloudOptions()
        }).catch(() => {
          // die sliently for now
        })
    })

    // get user's location by using the HTML5 geolocation API
    // ref: https://stackoverflow.com/questions/13840516/how-to-find-my-distance-to-a-known-location-in-javascript
    // improvement: show pop-up alert to ask for consent
    window.navigator.geolocation.getCurrentPosition((pos) => {
      this.setState({ location: { lat: pos.coords.latitude, lon: pos.coords.longitude } })
    })
  }

  filterCloudsByName = (name: string): Cloud[] => {
    const filtered = this.state.clouds.filter(cloud => {
      return cloud.cloud_name.indexOf(name) > -1
    })
    return filtered
  }

  filterCloudByRegion = (region: string, list: Cloud[]): Cloud[] => {
    const filtered = list.filter((item) => item.geo_region === region)
    return filtered
  }

  filterCloudByNameAndOrRegion = (): void => {
    const name = this.state.selectedCloud
    const region = this.state.selectedRegion

    const filteredByName = this.filterCloudsByName(name)
    if(region) {
      const filteredByNameAndRegion = this.filterCloudByRegion(region, filteredByName)
      this.setState({ filteredItems: filteredByNameAndRegion }, () => {
        this.sortDistanceAscen()
      })
    } else {
      this.setState({ filteredItems: filteredByName })
    }
  }

  getCloudFullName = (name: string):string => {
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

  setCloudOptions = (): void => {
    if(this.state.clouds.length > 0) {
      const names = this.state.clouds.map(cloud => cloud.cloud_name.split('-')[0])
      const uniqueNames = Array.from(new Set(names))
      const formattedOptions = [] as {[key:string]: string}[]
      uniqueNames.forEach((name) => {
        formattedOptions.push({ value: name, displayName: this.getCloudFullName(name)  })
      })
      this.setState({
        cloudNameOptions: formattedOptions,
        // select the first one by default
        selectedCloud: formattedOptions[0]?.value || ''
      }, () => {
        this.setRegionOptionsByCloudName(this.state.selectedCloud)
      })
    } else {
      this.setState({ cloudNameOptions: [{ value: '', displayName: '' }]})
    }
  }

  setRegionOptionsByCloudName = (cloudName: string): void => {
    if(cloudName) {
      const filteredClouds = this.filterCloudsByName(cloudName)
      const regions = filteredClouds.map(cloud => cloud.geo_region)
      const uniqueRegions = Array.from(new Set(regions))
      const formattedOptions = uniqueRegions.map(region => {
        const displayName = region.toLowerCase()
          .split(' ')
          .map((string) => string.charAt(0).toUpperCase() + string.substring(1))
          .join(' ')
        return { value: region, displayName }
      })
      // Improvement: check if the current selectedRegion also exists in the new region options, then use the same value instead of resetting it to index 0 value
      // but that might cause some unexpected UX and/or UI ... (TBD)
      this.setState({ regionOptions: formattedOptions, selectedRegion: formattedOptions[0]?.value || '' }, () => {
        this.filterCloudByNameAndOrRegion()
      })
    } else {
      this.setState({ regionOptions: [{ value: '', displayName: '' }] })
    }
  }

  handleCloudNameChange = (cloudName: string): void => {
    this.setState({ selectedCloud: cloudName }, () => {
      this.setRegionOptionsByCloudName(this.state.selectedCloud)
    })
  }

  handleRegionChange = (region: string): void => {
    this.setState({ selectedRegion: region }, () => {
      this.filterCloudByNameAndOrRegion()
    })
  }

  handleCityChange = (e: any): void => {
    this.setState({ selectedCity: e.target.value })
  }

  calculateDistances = (): Cloud[] => {
    let filteredList = this.state.filteredItems
    if(filteredList.length > 1) {
      filteredList.forEach((item, index) => {
        filteredList[index].distance = getDistanceFromLatLonInKm(item.geo_latitude, item.geo_longitude, this.state.location.lat, this.state.location.lon)
      })
    }
    // otherwise, no need to sort and cal distances
    
    return filteredList  
  }

  sortDistanceAscen = (): void => {
    let data = this.calculateDistances()
    
    let sortedData = data.sort((a, b) => (a.distance? a.distance : 0) - (b.distance? b.distance : 0))
    this.setState({ filteredItems: sortedData })
  }

  render() {     
    const selection = (
      <React.Fragment>
        <Dropdown 
          label="Select cloud"
          id="cloud"
          value={this.state.selectedCloud}
          handleOnChange={this.handleCloudNameChange}
          options={this.state.cloudNameOptions} />
        <Dropdown 
          label="Select region"
          id="region"
          value={this.state.selectedRegion}
          handleOnChange={this.handleRegionChange}
          options={this.state.regionOptions} />
        <div className="dropdown">
          <label htmlFor="city">
            Select city
            <small>(Listed from nearest to farest)</small>
          </label>
          <select name="city" id="city" onChange={this.handleCityChange} value={this.state.selectedCity}>
            {this.state.filteredItems.map((cloud, index) =>
              <option value={cloud.cloud_description} key={cloud.cloud_description + index}>{cloud.cloud_description}{(this.state.filteredItems.length !== 1 && index === 0)? ' * Nearest' : ''}</option>
            )}
          </select>
        </div>
      </React.Fragment>
    )
    
    return(
      <div className="content-wrapper">
        {this.state.isLoading? <p>Loading ....</p> : selection}
      </div>
    );
  }
}

export default CloudList;
