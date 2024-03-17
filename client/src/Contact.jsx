import React from 'react'
import Avatar from './Avatar'

export default function Contact({ id, username, onClick, selected, online }) {
    return (
        <div>
            <div key={id} onClick={() => onClick(id)}
                className={'border-b border-gray-100  flex items-center gap-2 cursor-pointer '
                    + (selected ? 'bg-blue-50' : '')}>
                {selected && (
                    <div className='w-1 bg-blue-500 h-12 rounded-r-md'></div>
                )}
                <div className='flex gap-2 items-center py-2 pl-2'>
                    <Avatar 
                        userId={id}
                        username={username}
                        online={online} />
                    <span className='text-gray-800'>{username}</span>
                </div>
            </div>
        </div>
    )
}
