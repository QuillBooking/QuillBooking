interface TagComponentProps {
  label: string;
}

const TagComponent: React.FC<TagComponentProps> = ({ label }) => {
  return (
    <div className="font-bold text-xs py-1 px-4 bg-[#EEE7F4] rounded-[40px] text-color-primary uppercase">
      {label}
    </div>
  )
}
export default TagComponent;