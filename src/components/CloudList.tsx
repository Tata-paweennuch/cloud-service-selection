import React, { Component } from 'react';
import './CloudList.scss';
import { CloudApi, Cloud } from '../apiclient/CloudApi'
import { getDistanceFromLatLonInKm } from '../helper/DistanceCalculation'
import Dropdown from './Dropdown'
import { Option } from './SharedInterface'

interface ICloudListState {
  clouds: Cloud[],
  isLoading: boolean,
  cloudNameOptions: Option[],
  regionOptions: Option[],
  selectedCloud: string,
  selectedRegion: string,
  selectedCity: string,
  filteredItems: Cloud[],
  location: {
    lat: number,
    lon: number
  }
}

export const emptyOption: Option = { value: '', displayName: '-- select an option --' }

class CloudList extends Component<{}, ICloudListState> {

  state: ICloudListState = {
    clouds: [],
    isLoading: false,
    cloudNameOptions: [emptyOption],
    regionOptions: [emptyOption],
    selectedCloud: '',
    selectedRegion: '',
    selectedCity: '',
    filteredItems: [],
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
          this.setRegionOptions()
          // now selectedCloud and selectedRegion are empty, so show all cloud options
          this.filterCloudByNameAndOrRegion()
        }).catch(() => {
          this.setState({ clouds: [], isLoading: false })
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
    const filtered = this.state.clouds.filter((cloud: Cloud) => {
      return cloud.cloud_name.includes(name)
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

    // if name only --> filter name 
    // if region only --> filter region
    // if name & region -->  filter name then region
    // if no name & region --> return the whole cloud list from API
    let filtered = this.state.clouds
    if(name) {
      filtered = this.filterCloudsByName(name)
    }
    if(region) {
      filtered = this.filterCloudByRegion(region, filtered)
    }

    this.setState({ filteredItems: filtered }, () => {
      this.sortDistanceAscen()
    })
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
      const names = this.state.clouds.map((cloud: Cloud) => cloud.cloud_name.split('-')[0])
      const uniqueNames = Array.from(new Set(names))
      const formattedOptions = [] as Option[]
      uniqueNames.forEach((name) => {
        formattedOptions.push({ value: name, displayName: this.getCloudFullName(name)  })
      })
      this.setState({
        cloudNameOptions: [emptyOption, ...formattedOptions]
      })
    } else {
      this.setState({ cloudNameOptions: [emptyOption]})
    }
  }

  setRegionOptions = (): void => {
    if(this.state.clouds.length > 0) {
      const regions = this.state.clouds.map(cloud => cloud.geo_region)
      const uniqueRegions = Array.from(new Set(regions))
      const formattedOptions = uniqueRegions.map(region => {
        const displayName = region.toLowerCase()
          .split(' ')
          .map((string) => string.charAt(0).toUpperCase() + string.substring(1))
          .join(' ')
        return { value: region, displayName }
      })
      this.setState({ regionOptions: [emptyOption, ...formattedOptions] })
    } else {
      this.setState({ regionOptions: [emptyOption] })
    }
  }

  handleCloudNameChange = (cloudName: string): void => {
    this.setState({ selectedCloud: cloudName }, () => {
      this.filterCloudByNameAndOrRegion()
    })
  }

  handleRegionChange = (region: string): void => {
    this.setState({ selectedRegion: region }, () => {
      this.filterCloudByNameAndOrRegion()
    })
  }

  handleCityChange = (e: React.SyntheticEvent): void => {
    const target  = e.target as HTMLSelectElement
    this.setState({ selectedCity: target.value })
  }

  calculateDistances = (): Cloud[] => {
    let filteredList = this.state.filteredItems
    if(filteredList.length > 1) {
      filteredList.forEach((item: Cloud, index) => {
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
    const filteredResult = () => {
      if(this.state.filteredItems.length > 0) {
        return this.state.filteredItems.map((cloud: Cloud, index: number) =>
          <option value={cloud.cloud_description} key={cloud.cloud_description + index}>{cloud.cloud_description}{(this.state.filteredItems.length !== 1 && index === 0)? ' * Nearest' : ''}</option>
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
            {filteredResult()}
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
