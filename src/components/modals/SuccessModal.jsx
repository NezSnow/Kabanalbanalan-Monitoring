import { spiritualDisplayName } from '../../utils/helpers'

export default function SuccessModal({ member, attendanceType, timestamp }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-custom shadow-2xl p-6 sm:p-8 text-center animate-scale-in">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-brand/20 rounded-full flex items-center justify-center success-icon-animation shadow-[0_0_26px_rgba(212,175,55,0.18)]">
            <svg className="h-16 w-16 text-brand" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" clipRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2">
          Check-in Successful!
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-brand mb-4 break-words">
          {member ? spiritualDisplayName(member) : 'Member'}
        </p>

        <div className="space-y-1">
          <p className="text-gray-500 font-medium">Recorded at:</p>
          <p className="text-base sm:text-lg font-bold break-words">{timestamp}</p>
          <p className="text-sm text-gray-400 mt-2">Type: {attendanceType}</p>
        </div>

        <p className="mt-6 text-xs text-slate-400">This will close automatically…</p>
      </div>
    </div>
  )
}
