
import React from 'react';
import { UserPlusIcon } from './icons/UserPlusIcon';
import { GiftIcon } from './icons/GiftIcon';
import { CommunityInterpretersGuildLogo } from './logos/CommunityInterpretersGuildLogo';
import { DeafTechInnovatorsLogo } from './logos/DeafTechInnovatorsLogo';
import { NationalAdvocacyForDeafLogo } from './logos/NationalAdvocacyForDeafLogo';
import { SignWellConnectLogo } from './logos/SignWellConnectLogo';

export const ProfessionalSignUpCta: React.FC = () => {
    return (
        <section id="professional-signup" className="bg-gradient-to-br from-slate-800 to-slate-900 border border-rose-500/30 rounded-xl p-6 md:p-8 shadow-2xl shadow-rose-500/10">
            <div className="flex items-center gap-3 mb-4">
                <UserPlusIcon className="w-8 h-8 text-rose-400" />
                <h2 className="text-2xl font-bold text-white">Join the Fibonrose Trust Network</h2>
            </div>
            <p className="text-slate-400 mb-6">
                Are you a licensed or certified professional serving the deaf community? Join our ecosystem to build a comprehensive, verified profile that clients can trust.
            </p>

            <ul className="space-y-3 mb-8 text-slate-300">
                <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                    <span>Showcase your <span className="font-semibold text-white">licenses, certifications, and background checks.</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-rose-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.41