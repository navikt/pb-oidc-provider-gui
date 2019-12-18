import React, {Component} from 'react';
import Cookies from 'js-cookie'

let cookieName = 'selvbetjening-idtoken';
let autoRedirectToFrontend = process.env.REACT_APP_AUTO_REDIRECT_TO_FRONTEND === "true" ? true : false;
let redirectToFrontend = process.env.REACT_APP_REDIRECT_URL ? process.env.REACT_APP_REDIRECT_URL : 'http://localhost:9002';
let oidcProviderGuiUrl = "http://localhost:5000/callback";
let oidcProviderBaseUrl = 'http://localhost:9000';
let audience = "stubOidcClient";
let clientSecret = "secretsarehardtokeep";
let authenticationHeader = new Buffer(audience + ":" + clientSecret).toString('base64');
let redirectToInitTokenFlow = oidcProviderBaseUrl + "/auth?client_id=" + audience + "&redirect_uri=" + oidcProviderGuiUrl + "&response_type=code&scope=openid+profile+acr+email&nonce=123";

class App extends Component {

    state = {
        idToken: "",
    };

    componentDidMount() {
        this.deleteCookieIfCurrentUrlSpecifiesLogout();
        this.updateIdTokenOnState(this.getCookieValue());
        let code = this.extractCodeFromUrl();
        if (code) {
            console.log("Code: " + code);
            this.fetchActualToken(code, oidcProviderBaseUrl + '/token');
        }
    }

    deleteCookieIfCurrentUrlSpecifiesLogout() {
        let currentUrl = window.location.href;
        if (this.isLogOutUrl(currentUrl)) {
            this.deleteCookie();
        }
    }

    isLogOutUrl(currentUrl) {
        return currentUrl.indexOf("?logout") !== -1;
    }

    deleteCookie() {
        let cookie = Cookies.get(cookieName);
        if (cookie) {
            Cookies.remove(cookieName);
        }
    }

    getCookieValue() {
        let cookie = Cookies.get(cookieName);
        if (cookie) {
            return cookie;
        } else {
            return "Cookie-en " + cookieName + " er ikke satt. Velg innloggingsnivå over, for å sette cookie-en.";
        }
    }

    updateIdTokenOnState(tokenValue) {
        this.setState(prevState => ({
            idToken: tokenValue
        }));
    }

    extractCodeFromUrl() {
        let currentUrl = window.location.href;
        let codeStartKeyWord = 'code=';
        let indexOfCode = currentUrl.indexOf(codeStartKeyWord);
        let sessionStateStartKeyWord = '&session_state=';
        let indexOfSessionState = currentUrl.indexOf(sessionStateStartKeyWord);
        let code = null;
        if (this.urlContainsCode(indexOfCode, indexOfSessionState)) {
            code = currentUrl.substring(indexOfCode + codeStartKeyWord.length, indexOfSessionState);
        }
        return code;
    }

    urlContainsCode(indexOfCode, indexOfSessionState) {
        return indexOfCode !== -1 && indexOfSessionState !== -1;
    }

    fetchActualToken(code, url) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + authenticationHeader
            },
            body: 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + oidcProviderGuiUrl + '&client_secret=' + clientSecret.toString("base64"),
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return null;
            })
            .then(json => {
                if (json != null) {
                    let idToken = this.removeSurroundingFnutts(json);
                    this.updateIdTokenOnState(idToken)
                    this.setCookie();
                    console.log("Complete token response:\n" + JSON.stringify(json))
                    this.performAutoRedirectToFrontendIfEnabled();
                }
                return json;
            })
            // eslint-disable-next-line no-console
            .catch((e) => console.log(`ERROR: ${e}`));
    };

    removeSurroundingFnutts(json) {
        return JSON.stringify(json.id_token).replace("\"", "").replace("\"", "");
    }

    setCookie() {
        if (this.state.idToken) {
            Cookies.set(cookieName, this.state.idToken);
        } else {
            console.log('Error: missing token');
        }
    }

    performAutoRedirectToFrontendIfEnabled() {
        if (autoRedirectToFrontend) {
            this.redirectToFrontend();
        }
    }

    render() {
        return (
            <div>
                <button onClick={() => this.redirectToAuthenticationPage("Level3")}>
                    Token for nivå 3
                </button>
                <button onClick={() => this.redirectToAuthenticationPage("Level4")}>
                    Token for nivå 4
                </button>

                <div>
                    <textarea name="idToken" id="idToken" cols="100" rows="10"
                              defaultValue={this.state.idToken != null ? this.state.idToken : "Token har ikke blitt hentet"}/><br/>
                </div>

                <button onClick={() => this.redirectToFrontend()}>
                    Redirect to frontend
                </button>
            </div>
        );
    }

    redirectToAuthenticationPage(sikkerhetsnivaa) {
        window.location.assign(`${redirectToInitTokenFlow}&acr_values=${sikkerhetsnivaa}`);
    }

    redirectToFrontend() {
        window.location.assign(`${redirectToFrontend}`);
    }

}

export default App;
