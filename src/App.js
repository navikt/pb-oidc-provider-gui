import React, {Component} from 'react';
import Cookies from 'js-cookie'
import {parse} from "query-string";

const tokenCookieName = 'selvbetjening-idtoken';
const autoRedirectToFrontend = window.env.AUTO_REDIRECT_TO_FRONTEND === "true" ? true : false;
const oidcProviderGuiUrl = getOidcProviderGuiUrl();
const oidcProviderBaseUrl = 'http://localhost:9000';
const audience = "stubOidcClient";
const clientSecret = "secretsarehardtokeep";
const authenticationHeader = new Buffer(audience + ":" + clientSecret).toString('base64');
const redirectToInitTokenFlow = oidcProviderBaseUrl + "/auth?client_id=" + audience + "&redirect_uri=" + oidcProviderGuiUrl + "&response_type=code&scope=openid+profile+acr+email&nonce=123";

function getOidcProviderGuiUrl() {
    let url = window.env.OIDC_PROVIDER_GUI_URL
    return url === undefined ? "http://localhost:50000/callback" : url;
}

class App extends Component {

    state = {
        idToken: "",
    };

    componentDidMount() {
        this.deleteCookieIfCurrentUrlSpecifiesLogout();
        this.updateIdTokenOnState(this.getTokenCookieValue());
        let code = this.extractCodeFromUrl();
        if (code) {
            console.log("Code: " + code);
            this.fetchActualToken(code, oidcProviderBaseUrl + '/token');
        }
    }

    deleteCookieIfCurrentUrlSpecifiesLogout() {
        let currentUrl = window.location.href;
        if (this.isLogOutUrl(currentUrl)) {
            this.deleteTokenCookie();
        }
    }

    isLogOutUrl(currentUrl) {
        return currentUrl.indexOf("?logout") !== -1;
    }

    deleteTokenCookie() {
        let cookie = Cookies.get(tokenCookieName);
        if (cookie) {
            Cookies.remove(tokenCookieName);
        }
    }

    getTokenCookieValue() {
        let cookie = Cookies.get(tokenCookieName);
        if (cookie) {
            return cookie;
        } else {
            return "Cookie-en " + tokenCookieName + " er ikke satt. Velg innloggingsnivå over, for å sette cookie-en.";
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
                    this.setTokenCookie();
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

    setTokenCookie() {
        if (this.state.idToken) {
            Cookies.set(tokenCookieName, this.state.idToken);
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
        let redirectToFrontendUrl = parse(window.location.search).redirect;
        if(!redirectToFrontendUrl) {
            redirectToFrontendUrl = window.env.REDIRECT_URL ? window.env.REDIRECT_URL : 'http://localhost:8090'
        }
        window.location.assign(`${redirectToFrontendUrl}`);
    }
}

export default App;
