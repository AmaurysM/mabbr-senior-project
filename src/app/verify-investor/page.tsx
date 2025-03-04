'use client'
import React, { useState } from 'react';
import './VerifyInvestor.css';

const VerifyInvestor: React.FC = () => {
    // TODO: Grab isVerified from database
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleVerifyClick = async () => {
        setLoading(true);
        setTimeout(() => {
            setIsVerified(true);
            setLoading(false);
            // TODO: Update database
        }, 2000);
    };

    // Image uses imgur link as workaround
    return (
        <div className="container">
            <table className="styled-table">
                <tbody>
                    <tr>
                        <td className="table-cell" colSpan={2}>
                            <h1 style={{ color: '#333', fontWeight: 'bold'}}>{isVerified ? 'You are now a Verified Investor!' : 'Become a Verified Investor today!'}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td className="table-cell" colSpan={2} style={{ textAlign: 'center' }}>
                            <img src={"https://i.imgur.com/ZW1daG1.png"} alt="Loaded from link" style={{ maxWidth: '25%', maxHeight: '25%', display: 'block', margin: '0 auto' }} />
                            <h1 className="h1-padding">Verified investors get a unique badge!</h1>
                        </td>
                    </tr>
                    <tr>
                        <td className="table-cell" colSpan={2} style={{ textAlign: 'center' }}>
                            {!isVerified && (
                                <button 
                                    className="verify-button" 
                                    onClick={handleVerifyClick} 
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify Me'}
                                </button>
                            )}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default VerifyInvestor;
