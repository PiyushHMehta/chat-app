import React from 'react'

export default function Avatar({ userId, username, online }) {
    const colors = [
        "bg-indigo-200",
        "bg-blue-200",
        "bg-yellow-200",
        "bg-green-200",
        "bg-red-200",
        "bg-indigo-200",
        "bg-pink-200",
        "bg-purple-200",
        "bg-teal-200",
        "bg-cyan-200"
    ];

    const userIdBase10 = parseInt(userId, 16)
    const colorIndex = (userIdBase10 % colors.length);
    const color = colors[colorIndex]
    const className = 'w-8 h-8 rounded-full flex items-center justify-center relative '

    const defaultClass = 'absolute w-2 h-2 rounded-full right-0 bottom-0 border border-white shadow-md '

    return (
        <div>
            <div className={className + color}>
                <div className='text-lg font-semibold placeholder-opacity-75'>{username[0].toUpperCase()}</div>
                {online && (
                    <div className={defaultClass + 'bg-green-400'}></div>
                )}
                {!online && (
                    <div className={defaultClass + 'bg-gray-400'}></div>
                )}
            </div>
        </div>
    )
}
