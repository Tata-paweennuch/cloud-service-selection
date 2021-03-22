import { Component } from 'react';
import { Option } from './SharedInterface'

interface DropdownProps {
  label: string,
  id: string,
  value: string,
  handleOnChange: (name: string) => void,
  options: Option[]
}

class Dropdown extends Component<DropdownProps, {}> {
  handleValueChange = (e: any) => {
    this.props.handleOnChange(e.target.value)
  }

  render() {
    const { label, id, value, options } = this.props

    // try to use semantic elements, so we can get the best accessibility
    return (
      <div className="dropdown">
        <label htmlFor={id}>{ label }</label>
        <select name={id} id={id} onChange={this.handleValueChange} value={value}>
          {options.map((option, index) =>
            <option value={option.value} key={option.value + index}>{option.displayName}</option>
          )}
        </select>
      </div>  
    )  
  }
}

export default Dropdown;
