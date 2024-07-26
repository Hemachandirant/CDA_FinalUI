// Initialize the MSAL instance with the configuration
const myMSALObj = new msal.PublicClientApplication(msalConfig);

let username = "";

function selectAccount() {
    const currentAccounts = myMSALObj.getAllAccounts();
    if (currentAccounts.length === 0) {
        return;
    } else if (currentAccounts.length > 1) {
        console.warn("Multiple accounts detected.");
    } else if (currentAccounts.length === 1) {
        username = currentAccounts[0].username;
        showWelcomeMessage(username);
    }
}

function handleResponse(response) {
    if (response !== null) {
        username = response.account.username;
        showWelcomeMessage(username);
    } else {
        selectAccount();
    }
}

async function signIn() {
    try {
        const activeInteraction = myMSALObj.getActiveAccount();
        if (activeInteraction) {
            console.warn("An interaction is already in progress. Please wait for it to complete.");
            return;
        }

        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts.length > 0) {
            console.log("User is already signed in");
            showWelcomeMessage(currentAccounts[0].username);
            return;
        }

        // Clear browser storage before starting the login process
        myMSALObj["browserStorage"].clear();

        await myMSALObj.loginRedirect(loginRequest);
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.error("Interaction required:", error);
        } else if (error instanceof msal.BrowserAuthError && error.errorCode === "interaction_in_progress") {
            console.error("Interaction is currently in progress. Please wait for the current interaction to complete.");
        } else {
            console.error("Error during sign-in:", error);
        }
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByUsername(username),
        postLogoutRedirectUri: msalConfig.auth.redirectUri,
        mainWindowRedirectUri: msalConfig.auth.redirectUri
    };

    myMSALObj.logoutRedirect(logoutRequest);
}

function showWelcomeMessage(username) {
    document.getElementById('welcomeMessage').style.display = 'block';
    document.getElementById('username').innerText = username;
}

// Ensure the selectAccount function runs when the script is loaded
selectAccount();

// Handle redirection flow after login
myMSALObj.handleRedirectPromise()
    .then((authResult) => {
        if (authResult) {
            console.log("Auth result:", authResult);
            handleResponse(authResult);
        } else {
            const account = myMSALObj.getActiveAccount();
            if (!account) {
                myMSALObj.loginRedirect(loginRequest);
            } else {
                showWelcomeMessage(account.username);
            }
        }
    })
    .catch((error) => {
        console.error("Error handling redirect:", error);
    });

// Set active account on page load if accounts are available
const accounts = myMSALObj.getAllAccounts();
if (accounts.length > 0) {
    myMSALObj.setActiveAccount(accounts[0]);
}

myMSALObj.addEventCallback((event) => {
    if (event.eventType === msal.EventType.LOGIN_SUCCESS && event.payload.account) {
        myMSALObj.setActiveAccount(event.payload.account);
        showWelcomeMessage(event.payload.account.username);
    }
}, (error) => {
    console.error('Event callback error:', error);
});
