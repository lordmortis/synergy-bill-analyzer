import step2 from './HelpImages/step2.png'
import step3 from './HelpImages/step3.png'
import step4 from './HelpImages/step4.png'
import step5 from './HelpImages/step5.png'
import step8a from './HelpImages/step8a.png'
import step8b from './HelpImages/step8b.png'

export default function Help() : React.ReactElement {
  return (
    <div className="help">
      <div key="1" className="helpSection">This web app (that runs entirely in your browser) can help you analyze your Synergy bill!
        (and eventually allow you to model potential savings via alternate tariffs, or other conditions)
      </div>
      <div key="2" className="helpSection">
        <span>To get the data this app requires, you need to:</span>
        <ul>
          <li>Have a <a href="https://www.synergy.net.au/Blog/2022/10/Guide-to-smart-meters">Smart Meter</a> installed</li>
          <li>Be able to log into <a href="https://selfserve.synergy.net.au/my-account.html">MyAccount</a> on the Synergy Website </li>
        </ul>
        <span>If you have all of the above, you can get the appropriate exports from the Synergy website by doing the following:</span>
        <ol>
          <li>Logging into My Account</li>
          <li>
            <div>Click on Usage</div>
            <a href={step2}><img src={step2} alt="Step 2 from synergy site" width="600"/></a>
          </li>
          <li>
            <div>Switch to Spreadsheet Mode</div>
            <a href={step3}><img src={step3} alt="Step 3 from synergy site" width="600"/></a>
          </li>
          <li>
            <div>Select the desired date range</div>
            <a href={step4}><img src={step4} alt="Step 4 from synergy site" width="600"/></a>
          </li>
          <li>
            <div>Click on Export</div>
            <a href={step5}><img src={step5} alt="Step 5 from synergy site" width="600"/></a>
          </li>
          <li>Select either download or email</li>
          <li>Click on "Half Hourly" as the download type</li>
          <li>
            <div>click on "CSV" as the file format</div>
            <div className="images">
              <a href={step8a} className="inline"><img src={step8a} alt="Step 8a from synergy site" width="400"/></a>
              <a href={step8a} className="inline"><img src={step8b} alt="Step 8b from synergy site" width="400"/></a>
            </div>
          </li>
          <li>You can use import this csv file by clicking "browse" in this webapp</li>
        </ol>
      </div>
    </div>
  )
}