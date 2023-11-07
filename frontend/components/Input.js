function Input({onChange, onEnter, ...otherProps}) {
  const onKeyUp = (event) => {
    if (event.key === 'Enter' && onEnter != null) {
      onEnter();
    }
  };
  return (
    <input
      onChange={(e) => {
        onChange(e.target.value);
      }}
      onKeyUp={onKeyUp}
      {...otherProps}
    />
  );
}

export default Input;
