/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { Button, Modal } from 'antd';

/**
 * Internal dependencies
 */
import { TrashIcon } from '../icons';

interface ConfirmationModalProps {
	title: string;
	description: string;
	showModal: boolean;
	setShowModal: (showModal: boolean) => void;
	onSave: () => void;
	isSaveBtnDisabled: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	title,
	description,
	showModal,
	setShowModal,
	onSave,
	isSaveBtnDisabled = false,
}) => {
	return (
		<Modal
			footer={null}
			closable={false}
			title={
				<div className="gap-2">
					<div className="flex flex-col justify-center items-center mb-4">
						<div className="text-[#EF4444] bg-[#EF44441F] p-2 rounded-lg">
							<TrashIcon width={56} height={56} />
						</div>
					</div>
					<p className="text-center text-color-primary-text text-xl font-bold">
						{title}
					</p>
					<p className="text-center text-[#71717A] font-normal">
						{description}
					</p>
				</div>
			}
			open={showModal}
		>
			{isSaveBtnDisabled ? (
				<div className="flex justify-center mt-4">
					<Button
						size="large"
						className="border border-[#71717A] text-[#71717A] w-1/2"
						onClick={() => {
							setShowModal(false);
						}}
					>
						{__('Back', 'quillbooking')}
					</Button>
				</div>
			) : (
				<div className="flex justify-between gap-2 mt-4">
					<Button
						size="large"
						className="border border-[#71717A] text-[#71717A] w-1/2"
						onClick={() => {
							setShowModal(false);
						}}
					>
						{__('Back', 'quillbooking')}
					</Button>
					<Button
						size="large"
						className="text-white bg-[#EF4444] w-1/2"
						onClick={() => {
							onSave();
							setShowModal(false);
						}}
					>
						{__('Yes, Delete', 'quillbooking')}
					</Button>
				</div>
			)}
		</Modal>
	);
};

export default ConfirmationModal;
