const
    currentDistanceInput = document.getElementById('currentDistance'),
    errorMessageBox = document.getElementById('errorMessageBox'),
    overallValues = document.getElementById('overallValues'),
    tbody = document.getElementsByTagName('tbody')[0]

const INTL_LOCALE = 'pl-PL', msInHour = 60 * 60 * 1000

let pointsArray = [], tracksArray = [], coordinates = null

window.onload = async () => {
    coordinates = await setCoordinates()
    initializePointsArray()
    //pointsArray = getMockedPoints()
    //drawTable()
}

class Coordinates {
    constructor(longitude, latitude) {
        this.longitude = longitude, this.latitude = latitude
    }
}

class Point {
    constructor(id, timeStamp, totalDistance, coordinates = null) {
        this.id = id, this.timeStamp = timeStamp, this.totalDistance = totalDistance, this.coordinates = coordinates
    }
}

class Track {
    constructor(name, length, start, end, duration, avgVelocity, totalDistance, totalDuration, totalAvgVelocity) {
        this.name = name, this.length = length, this.start = start, this.end = end, this.duration = duration, this.avgVelocity = avgVelocity,
            this.totalDistance = totalDistance, this.totalDuration = totalDuration, this.totalAvgVelocity = totalAvgVelocity
    }
}

const computeTableDetails = () => {
    tracksArray = []

    for (let i = 1; i < pointsArray.length; i++) {
        const
            trackName = `${pointsArray[i - 1].id.toString()}-${pointsArray[i].id.toString()}`,
            totalDistance = pointsArray[i].totalDistance,
            trackLength = totalDistance - pointsArray[i - 1].totalDistance,
            trackEnd = pointsArray[i].timeStamp,
            trackStart = pointsArray[i - 1].timeStamp,
            trackDuration = (trackEnd - trackStart) / msInHour,
            avgVelocity = trackLength / trackDuration,
            totalDuration = (trackEnd - pointsArray[0].timeStamp) / msInHour,
            totalAvgVelocity = totalDistance / totalDuration

        tracksArray.push(new Track(trackName, trackLength, trackStart, trackEnd, trackDuration, avgVelocity, totalDistance, totalDuration, totalAvgVelocity))
    }
}

const createNewPoint = (id, currentTime, currentDistance, coordinates) => {
    pointsArray.push(new Point(id, currentTime, currentDistance, coordinates))
    localStorage.setItem('pointsArray', JSON.stringify(pointsArray))
    drawTable()
}

const drawTable = () => {
    computeTableDetails()

    tbody.innerHTML = ""

    tracksArray.map(track => {
        const row = document.createElement('tr'),
            nameCell = document.createElement('td'),
            totalDistanceCell = document.createElement('td'),
            lengthCell = document.createElement('td'),
            startCell = document.createElement('td'),
            endCell = document.createElement('td'),
            durationCell = document.createElement('td'),
            avgVelocityCell = document.createElement('td'),
            totalDurationCell = document.createElement('td'),
            totalAvgVelocityCell = document.createElement('td')

        nameCell.innerText = track.name
        totalDistanceCell.innerText = getFormattedDistance(track.totalDistance)
        lengthCell.innerText = getFormattedDistance(track.length)
        startCell.innerText = getFormattedTime(track.start)
        endCell.innerText = getFormattedTime(track.end)
        durationCell.innerText = getFormattedDuration(track.duration)
        avgVelocityCell.innerText = getFormattedVelocity(track.avgVelocity)
        totalDurationCell.innerText = getFormattedDuration(track.totalDuration)
        totalAvgVelocityCell.innerText = getFormattedVelocity(track.totalAvgVelocity)

        row.append(nameCell)
        row.append(totalDistanceCell)
        row.append(lengthCell)
        row.append(startCell)
        row.append(endCell)
        row.append(durationCell)
        row.append(avgVelocityCell)
        row.append(totalDurationCell)
        row.append(totalAvgVelocityCell)

        tbody.append(row)
    })

    getOverallValues()
}

const getFormattedDuration = (value) => {
    return new Intl.NumberFormat(INTL_LOCALE, {
        style: "unit",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        unit: "hour"
    }).format(value)
}

const getFormattedDistance = (value) => {
    return new Intl.NumberFormat(INTL_LOCALE, {
        style: "unit",
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        unit: "kilometer"
    }).format(value)
}

const getFormattedTime = (value) => {
    return new Intl.DateTimeFormat(INTL_LOCALE, {
        hour: "numeric",
        minute: "numeric",
    }).format(value)
}

const getFormattedVelocity = (value) => {
    return new Intl.NumberFormat(INTL_LOCALE, {
        style: "unit",
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
        unit: "kilometer-per-hour"
    }).format(value)
}

const getMockedPoints = () => {
    return [
        new Point(0, 1684306800000, 0, new Coordinates(52.438954, 16.941982)),
        new Point(1, 1684310400000, 47.6, new Coordinates(52.314910, 17.534996)),
        new Point(2, 1684319400000, 294, new Coordinates(52.198223, 20.832467)),
        new Point(3, 1684319800000, 294, new Coordinates(52.198223, 20.832467)),
        new Point(4, 1684321200000, 330, new Coordinates(52.193776, 21.276196)),
        new Point(5, 1684326600000, 469, new Coordinates(51.280100, 22.443624)),
        new Point(6, 1684332000000, 571, new Coordinates(50.496683, 22.197757)),
        new Point(7, 1684333000000, 587, new Coordinates(50.586485, 22.060135)),
    ]
}

const getOverallValues = () => {
    const overallTime = tracksArray.reduce((accumulator, track) => accumulator + (track.length === 0 ? 0 : track.duration), 0)

    if (overallTime !== 0) {
        const overallAvgSpeedFormatted = getFormattedVelocity(((tracksArray.at(-1)).totalDistance / overallTime))

        overallValues.innerHTML = `Netto: ${overallAvgSpeedFormatted} (${getFormattedDuration(overallTime)})`
    }
}

const handleOnSubmit = () => {
    const
        currentDistance = currentDistanceInput.value / 10,
        currentTime = new Date().valueOf(),
        prevPoint = pointsArray.at(-1)

    if (isNaN(currentDistance)) {
        updateMessageBox('Current distance is not a numeric value!')
        return
    } else if (currentDistance < prevPoint.totalDistance) {
        updateMessageBox(`Current distance must be a greater value then previous distance (${prevPoint.totalDistance * 10} hm)!`)
        return
    } else if (currentTime < prevPoint.timeStamp) {
        const timeFormatted = new Intl.DateTimeFormat(INTL_LOCALE, {
            hour: "numeric",
            minute: "numeric",
        }).format(new Date(prevPoint.timeStamp))

        updateMessageBox(`Current timestamp must be a greater value then previous timestamp (${timeFormatted})!`)
        return
    } else {
        errorMessageBox.innerText = null
        errorMessageBox.classList.add('d-none')
        currentDistanceInput.value = null
        createNewPoint(pointsArray.length, currentTime, currentDistance, coordinates)
    }
}

const initializePointsArray = () => {
    let cache = localStorage.getItem('pointsArray') ? JSON.parse(localStorage.getItem('pointsArray')) : null

    if (cache) {
        pointsArray = cache
        drawTable()
    } else {
        createNewPoint(0, new Date().valueOf(), 0, coordinates)
    }
}

const printData = () => {
    alert(localStorage.getItem('pointsArray'))
}

const resetData = () => {
    pointsArray = []
    tbody.innerHTML = null
    overallValues.innerHTML = null
    localStorage.removeItem("pointsArray")
    initializePointsArray()
}

const setCoordinates = async () => {
    const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    return new Coordinates(position.coords.longitude, position.coords.latitude)
}

const updateMessageBox = (message) => {
    errorMessageBox.innerText = message
    errorMessageBox.classList.remove('d-none')
}

