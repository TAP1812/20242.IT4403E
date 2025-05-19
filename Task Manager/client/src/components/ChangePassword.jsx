import { DialogTitle } from "@headlessui/react";
import React from "react";
import { useForm } from "react-hook-form";
import Button from "./Button";
import Loading from "./Loader";
import ModelWrapper from "./ModelWrapper";
import Textbox from "./TextBox";
import { toast } from "sonner";
import { useChangePasswordMutation } from "../redux/slices/api/userApiSlice";

const ChangePassword = ({ open, setOpen }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [changeUserPassword, { isLoading }] = useChangePasswordMutation();

  const handleOnSubmit = async (data) => {
    try {
      const res = await changeUserPassword(data).unwrap();
      toast.success("Password is changed successfully");

      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <ModelWrapper open={open} setOpen={setOpen}>
        <form onSubmit={handleSubmit(handleOnSubmit)} className=''>
          <DialogTitle
            as='h2'
            className='text-base font-bold leading-6 text-gray-900 mb-4'
          >
            Change Password
          </DialogTitle>
          <div className='mt-2 flex flex-col gap-6'>
          <Textbox
              placeholder='Current Password'
              type='password'
              name='current-password'
              label='Current Password'
              className='w-full rounded'
              register={register("currentPassword", {
                required: "Current Password is required!",
              })}
              error={errors.password ? errors.password.message : ""}
            />
            <Textbox
              placeholder='New Password'
              type='password'
              name='newPassword'
              label='New Password'
              className='w-full rounded'
              register={register("newPassword", {
                required: "New Password is required!",
              })}
              error={errors.password ? errors.password.message : ""}
            />
          </div>

          {isLoading ? (
            <div className='py-5'>
              <Loading />
            </div>
          ) : (
            <div className='py-3 mt-4 sm:flex sm:flex-row-reverse'>
              <Button
                type='submit'
                className='bg-blue-600 px-8 text-sm font-semibold text-white hover:bg-blue-700  sm:w-auto'
                label='Save'
              />

              <button
                type='button'
                className='bg-white px-5 text-sm font-semibold text-gray-900 sm:w-auto'
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </ModelWrapper>
    </>
  );
};

export default ChangePassword;