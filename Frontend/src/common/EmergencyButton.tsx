const EmergencyButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="flex h-10 w-[112px] items-center justify-center rounded-lg border border-[#d7d7d7] bg-white text-[11px] text-[#222] hover:bg-red-50"
    >
      Emergency
    </button>
  );
};

export default EmergencyButton;
