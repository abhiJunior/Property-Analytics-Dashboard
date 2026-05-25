

function KPICards({value}) {
  return (
    <div className='w-auto h-40 bg-purple-400 rounded-2xl flex flex-col justify-around items-center'>
        <div className='mx-auto p-2 font-medium'>Total Properties Registered </div>
        <div className='text-3xl font-serif'>{value}</div>
    </div>
  )
}

export default KPICards
