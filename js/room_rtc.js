const APP_ID = "83a98630ec2849619f6ad9c71570616f";

let uid = sessionStorage.getItem('uid');
if (!uid) {
    uid = String(Math.floor(Math.random() * 10000));
    sessionStorage.setItem('uid', uid);
}

let token = null;
let client;

// room.html?room=234
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get('room');

if(!roomId) {
    roomId = 'main';
}

// Local tracks
let localTracks = [];
let remoteUsers = {};

// Create a client and join the room
const joinRoomInit = async () => {
    client = AgoraRTC.createClient({mode: 'rtc', codec: 'vp8'});
    await client.join(APP_ID, roomId, token, uid);

    // Event Listeners
    client.on('user-published', handleUserPublished);
    client.on('user-left', handleUserLeft);

    joinStream();
}

const joinStream = async () => {
    // For quality
    // {}, {encoderConfig: {
    //     width: {min: 640, ideal: 1920, max: 1920},
    //     height: {min: 480, ideal: 1080, max: 1080}
    // }}
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();
    let player = `<div class="video__container" id="user-container-${uid}">
                    <div class="video-player" id="user-${uid}"></div>
                </div>`;
    document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
    document.getElementById(`user-container-${uid}`).addEventListener('click', expandVideoFrame);
    localTracks[1].play(`user-${uid}`);
    await client.publish([localTracks[0], localTracks[1]]);
}

const handleUserPublished = async (user, mediaType) => {
    remoteUsers[user.uid] = user;
    await client.subscribe(user, mediaType);
    let player = document.getElementById(`user-container-${user.uid}`);
    if(player === null) {
        player = `<div class="video__container" id="user-container-${user.uid}">
                    <div class="video-player" id="user-${user.uid}"></div>
                </div>`;
        document.getElementById('streams__container').insertAdjacentHTML('beforeend', player);
        document.getElementById(`user-container-${user.uid}`).addEventListener('click', expandVideoFrame);
    }
    
    if(displayFrame.style.display) {
        let videoFrame = document.getElementById(`user-container-${user.uid}`)
        videoFrame.style.height = '100px';
        videoFrame.style.width = '100px';
    }

    if(mediaType === 'video')
    {
        user.videoTrack.play(`user-${user.uid}`);
    }

    if(mediaType === 'audio')
    {
        user.audioTrack.play();
    }
}

// Removing the user from remote users and removing the div from the dom
const handleUserLeft = async (user) => {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    if(userIdInDisplayFrame === `user-container-${user.uid}`) {
        displayFrame.style.display = 'none';
        let videoFrames = document.getElementsByClassName('video__container');
        for(let i = 0; i < videoFrames.length; i++)
        {
            videoFrames[i].style.height = '300px';
            videoFrames[i].style.width = '300px';
        }
    }

}

const toggleCamera = async (e) => {
    let button = e.currentTarget;

    if(localTracks[1].muted) {
        await localTracks[1].setMuted(false);
        button.classList.add('active');
    } else {
        await localTracks[1].setMuted(true);
        button.classList.remove('active');
    }

}

const toggleMic = async (e) => {
    let button = e.currentTarget;

    if(localTracks[0].muted) {
        await localTracks[0].setMuted(false);
        button.classList.add('active');
    } else {
        await localTracks[0].setMuted(true);
        button.classList.remove('active');
    }

}

document.getElementById('camera-btn').addEventListener('click', toggleCamera);
document.getElementById('mic-btn').addEventListener('click', toggleMic);
joinRoomInit();