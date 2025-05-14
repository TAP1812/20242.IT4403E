import clsx from 'clsx'
import React from 'react'
import { IoMdAdd } from 'react-icons/io'

const TaskTitle = ({label, className}) => {
  return (
    <div className="w-full h-10 md:h-12 px-2 md:px-4 rounded bg-white relative grid place-items-center">
  <div className='absolute left-2 md:left-4 flex gap-2 items-center'>
    <div className={clsx('w-4 h-4 rounded-full', className)} />
  </div>
  <p className='text-sm md:text-base text-gray-600 text-center'>{label}</p>
</div>

  )
}

export default TaskTitle
