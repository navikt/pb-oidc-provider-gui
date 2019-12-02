import React, {Component} from 'react';
import Cookies from 'js-cookie'

let audience = "stubOidcClient";
let redirectTo = "http://localhost:5000/callback";
let oidcProviderBaseUrl = 'http://localhost:9000';
let dittNavHendelserUrl = 'http://localhost:9002?hendelser';
let redirectToInitTokenFlow = oidcProviderBaseUrl + "/auth?client_id=" + audience + "&redirect_uri=" + redirectTo + "&response_type=code&scope=openid+profile+acr+email&nonce=123";
let clientSecret = "secretsarehardtokeep";
let authenticationHeader = new Buffer(audience + ":" + clientSecret).toString('base64');

class App extends Component {
    state = {
        idToken: "",
    };

    redirectToAuthenticationPage(sikkerhetsnivaa) {
        window.location.assign(`${redirectToInitTokenFlow}&acr_values=${sikkerhetsnivaa}`);
    }

    redirectToDittNav() {
        window.location.assign(`${dittNavHendelserUrl}`);
    }

    setCookie() {
        let hasToken = this.state.idToken !== "";
        if (hasToken) {
            Cookies.set('selvbetjening-idtoken', this.state.idToken);
            this.redirectToDittNav();
        }
        console.log('Error: missing token');
    }

    componentDidMount() {
        let code = this.extractCodeFromUrl();
        if (code) {
            console.log("Code: " + code);
            this.fetchActualToken(code, oidcProviderBaseUrl + '/token');
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
                <button onClick={() => this.setCookie()}>
                    Sett cookie
                </button>
                <div>
                    <textarea name="idToken" id="idToken" cols="100" rows="10"
                              defaultValue={this.state.idToken != null ? this.state.idToken : "Token har ikke blitt hentet"} /><br/>
                </div>
            </div>
        );
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
            body: 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + redirectTo + '&client_secret=' + clientSecret.toString("base64"),
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                return null;
            })
            .then(json => {
                if (json != null) {
                    let idToken = this.removeSuroundingFnutts(json);
                    this.setState(prevState => ({
                        idToken: idToken
                    }));
                    console.log("Complete token response:\n" + JSON.stringify(json))
                }
                return json;
            })
            // eslint-disable-next-line no-console
            .catch((e) => console.log(`ERROR: ${e}`));
    };

    removeSuroundingFnutts(json) {
        return JSON.stringify(json.id_token).replace("\"", "").replace("\"", "");
    }
}

export default App;
