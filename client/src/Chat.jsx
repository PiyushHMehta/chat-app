import React, { useContext, useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'
import Logo from './Logo'
import { UserContext } from './UserContext'
import { uniqBy } from 'lodash'
import axios from 'axios'
import Contact from './Contact'

export default function Chat() {
    const [ws, setWs] = useState(null)
    const [onlinePeople, setOnlinePeople] = useState({})
    const [offlinePeople, setOfflinePeople] = useState({})
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [newMessageText, setNewMessageText] = useState('')
    const [messages, setMessages] = useState([])
    const { username, id, setId, setUsername } = useContext(UserContext)

    const divUnderMessages = useRef()

    useEffect(() => {
        connectToWs()
    }, [])

    function connectToWs() {
        const ws = new WebSocket('ws://localhost:4040')
        setWs(ws)
        ws.addEventListener('message', handleMessage)
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect');
                connectToWs()
            }, 1000);
        })
    }

    function handleMessage(ev) {
        const messageData = JSON.parse(ev.data)
        // console.log({ev, messageData});
        if ('online' in messageData) {
            showOnlinePeople(messageData.online)
        } else if ('text' in messageData) {
            setMessages(prev => ([...prev, { ...messageData }]))
        }
    }

    function showOnlinePeople(peopleArray) {
        const people = {}
        peopleArray.forEach(({ userId, username }) => {
            people[userId] = username
        })
        setOnlinePeople(people)
    }

    function sendMessage(ev, file = null) {
        if (ev) ev.preventDefault()
        ws.send(JSON.stringify({
            recipient: selectedUserId,
            text: newMessageText,
            file,
        }))
        if (file) {
            axios.get('/messages/' + selectedUserId).then(res => {
                setMessages(res.data)
            })
        } else {
            setNewMessageText('')
            setMessages(prev => ([...prev, { text: newMessageText, sender: id, recipient: selectedUserId, _id: Date.now() }]))
        }
    }

    function sendFile(ev) {
        const reader = new FileReader()
        reader.readAsDataURL(ev.target.files[0])
        reader.onload = () => {
            sendMessage(null, {
                name: ev.target.files[0].name,
                data: reader.result,
            })
        }
    }

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null)
            setId(null)
            setUsername(null)
        })
    }

    useEffect(() => {
        const div = divUnderMessages.current
        if (div) {
            div.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
    }, [messages])

    useEffect(() => {
        axios.get('/people').then(res => {
            const offlinePeopleArray = res.data.filter(p => p._id !== id).filter(p => !Object.keys(onlinePeople).includes(p._id))
            const offlinePeople = {}
            offlinePeopleArray.forEach(p => {
                offlinePeople[p._id] = p
            })
            setOfflinePeople(offlinePeople)
        })
    }, [onlinePeople])

    useEffect(() => {
        if (selectedUserId) {
            axios.get('/messages/' + selectedUserId).then(res => {
                setMessages(res.data)
            })
        }
    }, [selectedUserId])


    const onlinePeopleExcludingUser = { ...onlinePeople }
    delete onlinePeopleExcludingUser[id]

    // console.log({onlinePeopleExcludingUser, offlinePeople});
    // both have different structures, offlinepeople is like 
    // {
    //     _id: {
    //         username,
    //         _id,
    //     }
    // }
    // online people is like
    // {_id: username}


    const messagesWithoutDupes = uniqBy(messages, '_id')

    return (
        <div className='flex h-screen'>
            <div className="bg-white w-1/3 flex flex-col">
                <div className='flex-grow'>
                    <Logo onClick={() => setSelectedUserId(null)} />
                    {Object.keys(onlinePeopleExcludingUser).map(userId => (
                        <Contact key={userId}
                            id={userId}
                            online={true}
                            username={onlinePeopleExcludingUser[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId} />
                    ))}

                    {Object.keys(offlinePeople).map(userId => (
                        <Contact key={userId}
                            id={userId}
                            online={false}
                            username={offlinePeople[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId} />
                    ))}
                </div>

                <div className='p-2 text-center flex gap-4 items-center justify-center'>
                    <span className='mr-2 text-blue-500 flex gap-1 items-center justify-center text-md'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0 0 21.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 0 0 3.065 7.097A9.716 9.716 0 0 0 12 21.75a9.716 9.716 0 0 0 6.685-2.653Zm-12.54-1.285A7.486 7.486 0 0 1 12 15a7.486 7.486 0 0 1 5.855 2.812A8.224 8.224 0 0 1 12 20.25a8.224 8.224 0 0 1-5.855-2.438ZM15.75 9a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </span>
                    <button onClick={logout} className='text-white text-md bg-blue-500 rounded-md py-2 px-4'>Logout</button>
                </div>
            </div>

            <div className="bg-blue-50 w-2/3 p-2 flex flex-col">
                <div className='flex-grow'>
                    {!selectedUserId && (
                        <div className='h-full flex items-center justify-center'>
                            <div className='text-gray-400 flex gap-2 items-center '>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mt-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                </svg>
                                <span>Select a contact from the sidebar</span>
                            </div>
                            {/* <div className='h-full w-full bg-gradient-to-r from-blue-200 to-purple-200'></div> */}
                        </div>
                    )}

                    {!!selectedUserId && (
                        <div className='relative h-full mb-4'>
                            <div className='overflow-y-scroll absolute top-0 left-0 right-0 bottom-4'>
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={'inline-block p-2 rounded-md my-2 text-sm text-left max-w-[50%] ' + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-500')}>
                                            {message.text}
                                            {message.file && (
                                                <div className='flex items-center gap-1'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                    </svg>
                                                    <a target='_blank' className='underline' href={axios.defaults.baseURL + "/uploads/" + message.file}>
                                                        {message.file}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div className='' ref={divUnderMessages}></div>
                            </div>
                        </div>
                    )}
                </div>

                {!!selectedUserId && (
                    <form className='flex gap-2' onSubmit={sendMessage}>
                        <label className='bg-blue-500 p-2 text-white rounded-sm cursor-pointer'>
                            <input type="file" className='hidden' onChange={sendFile} />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>
                        </label>

                        <input type="text" placeholder='Type your message here'
                            value={newMessageText} onChange={ev => setNewMessageText(ev.target.value)}
                            className='bg-white p-2 border flex-grow rounded-sm border-blue-500' />

                        <button className='bg-blue-500 p-2 text-white rounded-sm' type='submit'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}

            </div>
        </div>
    )
}
