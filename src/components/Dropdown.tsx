import React from 'react';
import { Option } from './SharedInterface'

interface DropdownProps {
  label: string,
  id: string,
  value: string,
  handleOnChange: (name: string) => void,
  options: Option[]
}

const Dropdown = (props: DropdownProps) => {
  const {label, id, value, handleOnChange, options} = props

  const handleValueChange = (e: React.SyntheticEvent) => {
    const target  = e.target as HTMLSelectElement
    handleOnChange(target.value)
  }

  // try to use semantic elements, so we can get the best accessibility
  return (
    <div className="dropdown">
      <label htmlFor={id}>{ label }</label>
      <select name={id} id={id} onChange={handleValueChange} value={value}>
        {options.map((option, index) =>
          <option value={option.value} key={option.value + index}>{option.displayName}</option>
        )}
      </select>
    </div>  
  )  
}

export default Dropdown;
