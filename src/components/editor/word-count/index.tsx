interface WordCountPluginProps { 
  wordCount: number;
}

const WordCountPlugin: React.FC<WordCountPluginProps> = ({wordCount}) => {
  return (
    <div>
      {wordCount} words
    </div>
  )
}

export default WordCountPlugin;