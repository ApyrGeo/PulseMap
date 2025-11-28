import { Location } from '../../Interfaces';

interface AdminLocationPopupProps {
  location: Location;
}

const AdminLocationPopup = ({ location }: AdminLocationPopupProps) => {
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-3 min-w-[250px]">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{location.name}</h3>

      {location.description && (
        <p className="text-sm text-gray-600 mb-3">{location.description}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Status:</span>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              location.isExpired
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {location.isExpired ? 'Expired' : 'Active'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Category:</span>
          <span className="text-gray-800">{location.category}</span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium text-gray-600">Creator:</span>
          <span className="text-gray-800">{location.creator.username}</span>
        </div>

        {location.isExpired ? (
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Expired:</span>
            <span className="text-gray-800">
              {formatDateTime(location.expiresAt)}
            </span>
          </div>
        ) : (
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Expires:</span>
            <span
              className={`${
                location.isExpired
                  ? 'text-red-600 font-semibold'
                  : 'text-gray-800'
              }`}
            >
              {formatDateTime(location.expiresAt)}
            </span>
          </div>
        )}

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Comments:</span>
            <span className="text-gray-800">{location.messages.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLocationPopup;
