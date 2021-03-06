import {
	FormControl,
	FormLabel,
	Input,
	FormErrorMessage,
	Textarea,
	ComponentWithAs,
	TextareaProps,
	InputProps,
} from '@chakra-ui/react'
import { useField } from 'formik'
import React, { InputHTMLAttributes } from 'react'

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
	name: string
	label: string
	textarea?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({
	label,
	size: _,
	textarea,
	...props
}) => {
	let InputOrTextArea = Input
	if (textarea) {
		InputOrTextArea = Textarea as any
	}
	const [field, { error }] = useField(props)
	return (
		<FormControl isInvalid={!!error}>
			<FormLabel htmlFor={field.name}>{label}</FormLabel>
			<InputOrTextArea
				{...field}
				{...props}
				id={field.name}
				placeholder={props.placeholder}
			/>
			{error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
		</FormControl>
	)
}
