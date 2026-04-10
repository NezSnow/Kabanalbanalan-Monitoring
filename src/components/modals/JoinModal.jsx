import { spiritualDisplayName } from '../../utils/helpers'

export default function JoinModal({ member, onPick, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-2xl rounded-custom shadow-2xl p-5 sm:p-8 animate-scale-in">
        <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
          {member?.img && (
            <img
              src={member.img}
              alt={member.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-primary/20 shadow-sm mb-3"
            />
          )}
          <h2 className="text-xl sm:text-2xl font-bold">
            How are you joining us today{member ? `, ${spiritualDisplayName(member)}?` : '?'}
          </h2>
          {member && (
            <p className="mt-1 text-sm text-slate-500">
              Please confirm this is your name before choosing.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 sm:p-6 bg-brand/10 border-2 border-brand hover:bg-brand hover:text-white transition-all duration-200 rounded-custom group"
            onClick={() => onPick('Online')}
          >
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 group-hover:scale-110 transition-transform"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-sm sm:text-base font-bold text-center leading-tight">Worship — Online</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 sm:p-6 bg-brand/10 border-2 border-brand hover:bg-brand hover:text-white transition-all duration-200 rounded-custom group"
            onClick={() => onPick('Face to Face')}
          >
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 group-hover:scale-110 transition-transform"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm sm:text-base font-bold text-center leading-tight">Worship — Face to Face</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center p-4 sm:p-6 bg-brand/10 border-2 border-brand hover:bg-brand hover:text-white transition-all duration-200 rounded-custom group"
            onClick={() => onPick('SVJ')}
          >
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 group-hover:scale-110 transition-transform"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm sm:text-base font-bold text-center leading-tight">Worship — SVJ</span>
          </button>
        </div>

        <p className="text-center mt-5 sm:mt-6 text-gray-500 text-sm">
          Please select an option to complete check-in
        </p>
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            className="text-secondary underline text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
