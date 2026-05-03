
const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((position) => {
            resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude
            })
        },
            (error) => reject(error))
    })
}

(function () {
    const nearbyTrailsButton = document.getElementById('nearby-trails');
    const radiusDropdown = document.getElementById('search-radius');

    if (nearbyTrailsButton && radiusDropdown) {
        nearbyTrailsButton.addEventListener('click', async function (event) {
            event.preventDefault();

            try {
                const { lat, lon } = await getUserLocation();
                const miles = radiusDropdown.value;
                window.location.href = `/trails/nearby?lat=${lat}&lon=${lon}&miles=${miles}`
            } catch (error) {
                console.error("Geolaction Error: " + error.message)
            }
        })
    }
})()