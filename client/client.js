const publicVapidKey = "BEZyIQRsN0dbx9Rri6Lr0O_UOmBd_r1uzpdnmdtXdrMxWuekAri8suhpV2VDuzLSmswNdiJ8l-dvliuOO_dQ1Qc";

if('serviceWorker' in navigator) {
    registerServiceWorker().catch(console.log)
}

async function registerServiceWorker() {
    const register = await navigator.serviceWorker.register('./worker.js', {
        scope: '/'
    });

    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicVapidKey,
    });

    await fetch("/subscribe", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
            "Content-Type": "application/json",
        }
    })
}