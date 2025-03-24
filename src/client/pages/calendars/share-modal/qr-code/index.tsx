import { __ } from "@wordpress/i18n";
import { Button, Flex, QRCode } from "antd";
import React from "react";
import { BsInfoCircleFill } from "react-icons/bs";
import { RiDownloadCloud2Line } from "react-icons/ri";


const QrCode: React.FC<{ url: string; icon: React.ReactNode; title: string }> = ({ url, icon, title }) => {

    return (
        <>
            <Flex gap={10} className="flex items-center border-b pb-4 border-[#E4E4E4] mb-4">
                <div className="rounded-lg p-2 border border-color-secondary">
                    {icon}
                </div>
                <div className='flex flex-col'>
                    <span className='text-[#09090B] text-[20px] font-[700]'>{title}</span>
                    <span className="text-[12px] font-[400] text-[#71717A]">{__("Share your form with others by scanning the QR code.","quillbooking")}</span>
                </div>
            </Flex>
            <span className="text-[#71717A] text-[14px] font-[500] leading-5">{__("Simply scan the code to initiate your Quill Forms, which function seamlessly both online and offline (printer required naturally).","quillbooking")}
            </span>
            <div className="border bg-[#FBFBFB] py-2 px-4 rounded mt-4">
                <div className="flex items-center text-[14px]">
                    <BsInfoCircleFill className="text-[#727C88] mr-2" />
                    <span className="text-[#727C88] font-semibold">{__("Notice","quillbooking")}</span>
                </div>
                <span className="text-[#999999] text-[12px] font-[400]">{__("Changing the slug of your form within the builder will result in a corresponding alteration of the QR code.","quillbooking")}</span>
            </div>

            {/* static */}
            <Flex vertical className="items-center justify-center p-4">
                <QRCode value={url} size={160} className="border-none pb-4"/>
                <Button className="bg-color-primary h-[48px] px-7 rounded-lg">
                    <RiDownloadCloud2Line className="text-white text-[18px]" />
                    <span className="text-white text-[16px] font-[500] self-center">{__("Download","quillbooking")}</span>
                </Button>
            </Flex>
        </>
    );
};

export default QrCode;