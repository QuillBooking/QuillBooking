interface WordCountPluginProps { 
  wordCount: number;
}

const WordCountPlugin: React.FC<WordCountPluginProps> = ({wordCount}) => {
  return (
    <div className="word-count bg-[#FCFCFC] border-t py-2 px-5 text-[#1A1A1AB2]">
      {wordCount} words
    </div>
  )
}

export default WordCountPlugin;